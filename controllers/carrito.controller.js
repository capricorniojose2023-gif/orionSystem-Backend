const { sql, poolPromise } = require('../config/database');


// =====================================================
// OBTENER CARRITO DEL USUARIO AUTENTICADO
// GET /api/carrito
// =====================================================

const obtenerCarrito = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const pool = await poolPromise;

        const carritoResult = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    id_carrito,
                    id_usuario,
                    fecha_creacion,
                    fecha_actualizacion,
                    activo
                FROM carritos
                WHERE id_usuario = @id_usuario
                  AND activo = 1
            `);

        if (carritoResult.recordset.length === 0) {
            return res.json({
                mensaje: 'El usuario no tiene un carrito activo',
                carrito: null,
                productos: [],
                total: 0
            });
        }

        const carrito = carritoResult.recordset[0];

        const detalleResult = await pool.request()
            .input('id_carrito', sql.Int, carrito.id_carrito)
            .query(`
                SELECT
                    cd.id_carrito_detalle,
                    cd.id_carrito,
                    cd.id_producto,
                    p.nombre AS nombre_producto,
                    p.imagen,
                    cd.cantidad,
                    cd.precio_unitario,
                    (cd.cantidad * cd.precio_unitario) AS subtotal
                FROM carrito_detalle cd
                INNER JOIN productos p
                    ON cd.id_producto = p.id_producto
                WHERE cd.id_carrito = @id_carrito
                ORDER BY cd.id_carrito_detalle DESC
            `);

        const total = detalleResult.recordset.reduce(
            (suma, item) => suma + Number(item.subtotal),
            0
        );

        res.json({
            carrito,
            productos: detalleResult.recordset,
            total: Number(total.toFixed(2))
        });

    } catch (error) {
        console.error('Error obteniendo carrito:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// AGREGAR PRODUCTO AL CARRITO
// POST /api/carrito/agregar
// =====================================================

const agregarProducto = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const { id_producto, cantidad } = req.body;

        if (!id_producto || !cantidad) {
            return res.status(400).json({
                mensaje: 'id_producto y cantidad son obligatorios'
            });
        }

        if (cantidad <= 0) {
            return res.status(400).json({
                mensaje: 'La cantidad debe ser mayor que 0'
            });
        }

        const pool = await poolPromise;

        // Verificar producto
        const productoResult = await pool.request()
            .input('id_producto', sql.Int, id_producto)
            .query(`
                SELECT
                    id_producto,
                    nombre,
                    precio,
                    stock,
                    activo
                FROM productos
                WHERE id_producto = @id_producto
            `);

        if (productoResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        const producto = productoResult.recordset[0];

        if (!producto.activo) {
            return res.status(400).json({
                mensaje: 'El producto no está disponible'
            });
        }

        if (producto.stock <= 0) {
            return res.status(400).json({
                mensaje: 'El producto no tiene stock disponible'
            });
        }

        // Obtener o crear carrito
        let carritoResult = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT TOP 1
                    id_carrito
                FROM carritos
                WHERE id_usuario = @id_usuario
                  AND activo = 1
                ORDER BY id_carrito DESC
            `);

        let id_carrito;

        if (carritoResult.recordset.length === 0) {

            const nuevoCarrito = await pool.request()
                .input('id_usuario', sql.Int, id_usuario)
                .query(`
                    INSERT INTO carritos (
                        id_usuario
                    )
                    OUTPUT INSERTED.id_carrito
                    VALUES (
                        @id_usuario
                    )
                `);

            id_carrito = nuevoCarrito.recordset[0].id_carrito;

        } else {
            id_carrito = carritoResult.recordset[0].id_carrito;
        }

        // Verificar si el producto ya está en el carrito
        const detalleResult = await pool.request()
            .input('id_carrito', sql.Int, id_carrito)
            .input('id_producto', sql.Int, id_producto)
            .query(`
                SELECT
                    id_carrito_detalle,
                    cantidad
                FROM carrito_detalle
                WHERE id_carrito = @id_carrito
                  AND id_producto = @id_producto
            `);

        if (detalleResult.recordset.length > 0) {

            const detalle = detalleResult.recordset[0];
            const nuevaCantidad = detalle.cantidad + cantidad;

            if (nuevaCantidad > producto.stock) {
                return res.status(400).json({
                    mensaje: 'La cantidad solicitada supera el stock disponible',
                    stock_disponible: producto.stock,
                    cantidad_actual: detalle.cantidad
                });
            }

            await pool.request()
                .input(
                    'id_carrito_detalle',
                    sql.Int,
                    detalle.id_carrito_detalle
                )
                .input('cantidad', sql.Int, nuevaCantidad)
                .input('precio_unitario', sql.Decimal(10, 2), producto.precio)
                .query(`
                    UPDATE carrito_detalle
                    SET
                        cantidad = @cantidad,
                        precio_unitario = @precio_unitario
                    WHERE id_carrito_detalle = @id_carrito_detalle
                `);

        } else {

            if (cantidad > producto.stock) {
                return res.status(400).json({
                    mensaje: 'La cantidad solicitada supera el stock disponible',
                    stock_disponible: producto.stock
                });
            }

            await pool.request()
                .input('id_carrito', sql.Int, id_carrito)
                .input('id_producto', sql.Int, id_producto)
                .input('cantidad', sql.Int, cantidad)
                .input(
                    'precio_unitario',
                    sql.Decimal(10, 2),
                    producto.precio
                )
                .query(`
                    INSERT INTO carrito_detalle (
                        id_carrito,
                        id_producto,
                        cantidad,
                        precio_unitario
                    )
                    VALUES (
                        @id_carrito,
                        @id_producto,
                        @cantidad,
                        @precio_unitario
                    )
                `);
        }

        // Actualizar fecha del carrito
        await pool.request()
            .input('id_carrito', sql.Int, id_carrito)
            .query(`
                UPDATE carritos
                SET fecha_actualizacion = SYSDATETIME()
                WHERE id_carrito = @id_carrito
            `);

        res.status(201).json({
            mensaje: 'Producto agregado al carrito correctamente',
            id_carrito,
            id_producto,
            cantidad_agregada: cantidad
        });

    } catch (error) {
        console.error('Error agregando producto al carrito:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ACTUALIZAR CANTIDAD
// PUT /api/carrito/detalle/:id
// =====================================================

const actualizarCantidad = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const id_carrito_detalle = parseInt(req.params.id);
        const { cantidad } = req.body;

        if (!cantidad || cantidad <= 0) {
            return res.status(400).json({
                mensaje: 'La cantidad debe ser mayor que 0'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_carrito_detalle', sql.Int, id_carrito_detalle)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    cd.id_carrito_detalle,
                    cd.id_carrito,
                    cd.id_producto,
                    p.stock
                FROM carrito_detalle cd
                INNER JOIN carritos c
                    ON cd.id_carrito = c.id_carrito
                INNER JOIN productos p
                    ON cd.id_producto = p.id_producto
                WHERE cd.id_carrito_detalle = @id_carrito_detalle
                  AND c.id_usuario = @id_usuario
                  AND c.activo = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Detalle del carrito no encontrado'
            });
        }

        const detalle = result.recordset[0];

        if (cantidad > detalle.stock) {
            return res.status(400).json({
                mensaje: 'La cantidad supera el stock disponible',
                stock_disponible: detalle.stock
            });
        }

        await pool.request()
            .input('id_carrito_detalle', sql.Int, id_carrito_detalle)
            .input('cantidad', sql.Int, cantidad)
            .query(`
                UPDATE carrito_detalle
                SET cantidad = @cantidad
                WHERE id_carrito_detalle = @id_carrito_detalle
            `);

        await pool.request()
            .input('id_carrito', sql.Int, detalle.id_carrito)
            .query(`
                UPDATE carritos
                SET fecha_actualizacion = SYSDATETIME()
                WHERE id_carrito = @id_carrito
            `);

        res.json({
            mensaje: 'Cantidad actualizada correctamente'
        });

    } catch (error) {
        console.error('Error actualizando carrito:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ELIMINAR PRODUCTO DEL CARRITO
// DELETE /api/carrito/detalle/:id
// =====================================================

const eliminarProducto = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const id_carrito_detalle = parseInt(req.params.id);

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_carrito_detalle', sql.Int, id_carrito_detalle)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    cd.id_carrito_detalle,
                    cd.id_carrito
                FROM carrito_detalle cd
                INNER JOIN carritos c
                    ON cd.id_carrito = c.id_carrito
                WHERE cd.id_carrito_detalle = @id_carrito_detalle
                  AND c.id_usuario = @id_usuario
                  AND c.activo = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Producto del carrito no encontrado'
            });
        }

        const detalle = result.recordset[0];

        await pool.request()
            .input('id_carrito_detalle', sql.Int, id_carrito_detalle)
            .query(`
                DELETE FROM carrito_detalle
                WHERE id_carrito_detalle = @id_carrito_detalle
            `);

        await pool.request()
            .input('id_carrito', sql.Int, detalle.id_carrito)
            .query(`
                UPDATE carritos
                SET fecha_actualizacion = SYSDATETIME()
                WHERE id_carrito = @id_carrito
            `);

        res.json({
            mensaje: 'Producto eliminado del carrito correctamente'
        });

    } catch (error) {
        console.error('Error eliminando producto:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// VACIAR CARRITO
// DELETE /api/carrito/vaciar
// =====================================================

const vaciarCarrito = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const pool = await poolPromise;

        const carritoResult = await pool.request()
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
            return res.json({
                mensaje: 'El usuario no tiene un carrito activo'
            });
        }

        const id_carrito = carritoResult.recordset[0].id_carrito;

        await pool.request()
            .input('id_carrito', sql.Int, id_carrito)
            .query(`
                DELETE FROM carrito_detalle
                WHERE id_carrito = @id_carrito
            `);

        await pool.request()
            .input('id_carrito', sql.Int, id_carrito)
            .query(`
                UPDATE carritos
                SET fecha_actualizacion = SYSDATETIME()
                WHERE id_carrito = @id_carrito
            `);

        res.json({
            mensaje: 'Carrito vaciado correctamente'
        });

    } catch (error) {
        console.error('Error vaciando carrito:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


module.exports = {
    obtenerCarrito,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
    vaciarCarrito
};