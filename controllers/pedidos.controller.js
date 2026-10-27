const { sql, poolPromise } = require('../config/database');


// =====================================================
// CREAR PEDIDO A PARTIR DEL CARRITO
// POST /api/pedidos
// =====================================================

const crearPedido = async (req, res) => {
    const transaction = new sql.Transaction();

    try {
        const id_usuario = req.usuario.id_usuario;

        const {
            direccion_envio = null,
            observaciones = null,
            costo_envio = 0,
            impuestos = 0
        } = req.body;

        if (costo_envio < 0 || impuestos < 0) {
            return res.status(400).json({
                mensaje: 'El costo de envío y los impuestos no pueden ser negativos'
            });
        }

        const pool = await poolPromise;

        await transaction.begin();

        // =============================================
        // BUSCAR CARRITO ACTIVO
        // =============================================

        const carritoResult = await transaction.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT TOP 1
                    id_carrito
                FROM carritos
                WHERE id_usuario = @id_usuario
                  AND activo = 1
                ORDER BY id_carrito DESC
            `);

        if (carritoResult.recordset.length === 0) {
            await transaction.rollback();

            return res.status(400).json({
                mensaje: 'El usuario no tiene un carrito activo'
            });
        }

        const id_carrito = carritoResult.recordset[0].id_carrito;


        // =============================================
        // OBTENER PRODUCTOS DEL CARRITO
        // =============================================

        const detalleResult = await transaction.request()
            .input('id_carrito', sql.Int, id_carrito)
            .query(`
                SELECT
                    cd.id_carrito_detalle,
                    cd.id_producto,
                    cd.cantidad,
                    cd.precio_unitario,
                    p.nombre,
                    p.stock,
                    p.activo
                FROM carrito_detalle cd
                INNER JOIN productos p
                    ON cd.id_producto = p.id_producto
                WHERE cd.id_carrito = @id_carrito
            `);

        if (detalleResult.recordset.length === 0) {
            await transaction.rollback();

            return res.status(400).json({
                mensaje: 'El carrito está vacío'
            });
        }

        const productos = detalleResult.recordset;


        // =============================================
        // VALIDAR STOCK Y PRODUCTOS
        // =============================================

        for (const producto of productos) {

            if (!producto.activo) {
                await transaction.rollback();

                return res.status(400).json({
                    mensaje: `El producto "${producto.nombre}" ya no está disponible`,
                    id_producto: producto.id_producto
                });
            }

            if (producto.stock < producto.cantidad) {
                await transaction.rollback();

                return res.status(400).json({
                    mensaje: `Stock insuficiente para "${producto.nombre}"`,
                    id_producto: producto.id_producto,
                    stock_disponible: producto.stock,
                    cantidad_solicitada: producto.cantidad
                });
            }
        }


        // =============================================
        // CALCULAR SUBTOTAL
        // =============================================

        const subtotal = productos.reduce(
            (suma, producto) =>
                suma + (
                    Number(producto.precio_unitario) *
                    Number(producto.cantidad)
                ),
            0
        );

        const total =
            subtotal +
            Number(costo_envio) +
            Number(impuestos);


        // =============================================
        // CREAR PEDIDO
        // =============================================

        const pedidoResult = await transaction.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('subtotal', sql.Decimal(10, 2), subtotal)
            .input('costo_envio', sql.Decimal(10, 2), costo_envio)
            .input('impuestos', sql.Decimal(10, 2), impuestos)
            .input('total', sql.Decimal(10, 2), total)
            .input('direccion_envio', sql.NVarChar(500), direccion_envio)
            .input('observaciones', sql.NVarChar(500), observaciones)
            .query(`
                INSERT INTO pedidos (
                    id_usuario,
                    subtotal,
                    costo_envio,
                    impuestos,
                    total,
                    direccion_envio,
                    observaciones
                )
                OUTPUT INSERTED.*
                VALUES (
                    @id_usuario,
                    @subtotal,
                    @costo_envio,
                    @impuestos,
                    @total,
                    @direccion_envio,
                    @observaciones
                )
            `);

        const pedido = pedidoResult.recordset[0];


        // =============================================
        // INSERTAR DETALLE DEL PEDIDO
        // =============================================

        for (const producto of productos) {

            const productoSubtotal =
                Number(producto.precio_unitario) *
                Number(producto.cantidad);

            await transaction.request()
                .input('id_pedido', sql.Int, pedido.id_pedido)
                .input('id_producto', sql.Int, producto.id_producto)
                .input('nombre_producto', sql.NVarChar(150), producto.nombre)
                .input('cantidad', sql.Int, producto.cantidad)
                .input(
                    'precio_unitario',
                    sql.Decimal(10, 2),
                    producto.precio_unitario
                )
                .input(
                    'subtotal',
                    sql.Decimal(10, 2),
                    productoSubtotal
                )
                .query(`
                    INSERT INTO pedido_detalle (
                        id_pedido,
                        id_producto,
                        nombre_producto,
                        cantidad,
                        precio_unitario,
                        subtotal
                    )
                    VALUES (
                        @id_pedido,
                        @id_producto,
                        @nombre_producto,
                        @cantidad,
                        @precio_unitario,
                        @subtotal
                    )
                `);
        }


        // =============================================
        // DESCONTAR STOCK
        // =============================================

        for (const producto of productos) {

            await transaction.request()
                .input('id_producto', sql.Int, producto.id_producto)
                .input('cantidad', sql.Int, producto.cantidad)
                .query(`
                    UPDATE productos
                    SET
                        stock = stock - @cantidad,
                        fecha_actualizacion = SYSDATETIME()
                    WHERE id_producto = @id_producto
                      AND stock >= @cantidad
                `);
        }


        // =============================================
        // VACIAR CARRITO
        // =============================================

        await transaction.request()
            .input('id_carrito', sql.Int, id_carrito)
            .query(`
                DELETE FROM carrito_detalle
                WHERE id_carrito = @id_carrito
            `);

        await transaction.request()
            .input('id_carrito', sql.Int, id_carrito)
            .query(`
                UPDATE carritos
                SET fecha_actualizacion = SYSDATETIME()
                WHERE id_carrito = @id_carrito
            `);


        await transaction.commit();


        res.status(201).json({
            mensaje: 'Pedido creado correctamente',
            pedido
        });

    } catch (error) {

        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Error haciendo rollback:', rollbackError.message);
        }

        console.error('Error creando pedido:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER PEDIDOS DEL USUARIO AUTENTICADO
// GET /api/pedidos
// =====================================================

const obtenerMisPedidos = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    id_pedido,
                    id_usuario,
                    fecha_pedido,
                    subtotal,
                    costo_envio,
                    impuestos,
                    total,
                    estado,
                    direccion_envio,
                    observaciones
                FROM pedidos
                WHERE id_usuario = @id_usuario
                ORDER BY fecha_pedido DESC
            `);

        res.json({
            pedidos: result.recordset
        });

    } catch (error) {
        console.error('Error obteniendo pedidos:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER PEDIDO POR ID
// GET /api/pedidos/:id
// =====================================================

const obtenerPedidoPorId = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const id_pedido = parseInt(req.params.id);

        if (isNaN(id_pedido)) {
            return res.status(400).json({
                mensaje: 'ID de pedido inválido'
            });
        }

        const pool = await poolPromise;

        const pedidoResult = await pool.request()
            .input('id_pedido', sql.Int, id_pedido)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    id_pedido,
                    id_usuario,
                    fecha_pedido,
                    subtotal,
                    costo_envio,
                    impuestos,
                    total,
                    estado,
                    direccion_envio,
                    observaciones
                FROM pedidos
                WHERE id_pedido = @id_pedido
                  AND id_usuario = @id_usuario
            `);

        if (pedidoResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Pedido no encontrado'
            });
        }

        const pedido = pedidoResult.recordset[0];

        const detalleResult = await pool.request()
            .input('id_pedido', sql.Int, id_pedido)
            .query(`
                SELECT
                    id_pedido_detalle,
                    id_pedido,
                    id_producto,
                    nombre_producto,
                    cantidad,
                    precio_unitario,
                    subtotal
                FROM pedido_detalle
                WHERE id_pedido = @id_pedido
                ORDER BY id_pedido_detalle
            `);

        res.json({
            pedido,
            detalle: detalleResult.recordset
        });

    } catch (error) {
        console.error('Error obteniendo pedido:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


module.exports = {
    crearPedido,
    obtenerMisPedidos,
    obtenerPedidoPorId
};

