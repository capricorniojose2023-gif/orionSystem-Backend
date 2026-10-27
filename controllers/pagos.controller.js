const { sql, poolPromise } = require('../config/database');

// =====================================================
// REGISTRAR PAGO
// =====================================================

const crearPago = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const {
            id_pedido,
            metodo_pago,
            referencia,
            fecha_pago
        } = req.body;

        if (!id_pedido || !metodo_pago) {
            return res.status(400).json({
                mensaje: 'id_pedido y metodo_pago son obligatorios'
            });
        }

        const pool = await poolPromise;

        // =================================================
        // VERIFICAR QUE EL PEDIDO PERTENECE AL USUARIO
        // =================================================

        const pedidoResult = await pool.request()
            .input('id_pedido', sql.Int, id_pedido)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    id_pedido,
                    total,
                    estado
                FROM pedidos
                WHERE id_pedido = @id_pedido
                  AND id_usuario = @id_usuario
            `);

        if (pedidoResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Pedido no encontrado o no pertenece al usuario'
            });
        }

        const pedido = pedidoResult.recordset[0];

        // =================================================
        // VERIFICAR SI YA EXISTE UN PAGO PARA EL PEDIDO
        // =================================================

        const pagoExistente = await pool.request()
            .input('id_pedido', sql.Int, id_pedido)
            .query(`
                SELECT TOP 1
                    id_pago,
                    estado
                FROM pagos
                WHERE id_pedido = @id_pedido
                ORDER BY id_pago DESC
            `);

        if (pagoExistente.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'Este pedido ya tiene un registro de pago',
                pago: pagoExistente.recordset[0]
            });
        }

        // =================================================
        // CREAR PAGO
        // =================================================

        const result = await pool.request()
            .input('id_pedido', sql.Int, id_pedido)
            .input('metodo_pago', sql.VarChar(30), metodo_pago)
            .input('monto', sql.Decimal(10, 2), pedido.total)
            .input(
                'referencia',
                sql.VarChar(150),
                referencia || null
            )
            .input(
                'fecha_pago',
                sql.DateTime2,
                fecha_pago ? new Date(fecha_pago) : null
            )
            .query(`
                INSERT INTO pagos (
                    id_pedido,
                    metodo_pago,
                    monto,
                    estado,
                    referencia,
                    fecha_pago
                )
                OUTPUT INSERTED.*
                VALUES (
                    @id_pedido,
                    @metodo_pago,
                    @monto,
                    'PENDIENTE',
                    @referencia,
                    @fecha_pago
                )
            `);

        res.status(201).json({
            mensaje: 'Pago registrado correctamente',
            pago: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear pago:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER MIS PAGOS
// =====================================================

const obtenerMisPagos = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    p.id_pago,
                    p.id_pedido,
                    p.metodo_pago,
                    p.monto,
                    p.estado,
                    p.referencia,
                    p.fecha_pago,
                    p.fecha_registro
                FROM pagos p
                INNER JOIN pedidos pe
                    ON p.id_pedido = pe.id_pedido
                WHERE pe.id_usuario = @id_usuario
                ORDER BY p.fecha_registro DESC
            `);

        res.json({
            pagos: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener pagos:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER PAGO POR ID
// =====================================================

const obtenerPagoPorId = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const id_pago = parseInt(req.params.id);

        if (isNaN(id_pago)) {
            return res.status(400).json({
                mensaje: 'El ID del pago debe ser numérico'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_pago', sql.Int, id_pago)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    p.id_pago,
                    p.id_pedido,
                    p.metodo_pago,
                    p.monto,
                    p.estado,
                    p.referencia,
                    p.fecha_pago,
                    p.fecha_registro
                FROM pagos p
                INNER JOIN pedidos pe
                    ON p.id_pedido = pe.id_pedido
                WHERE p.id_pago = @id_pago
                  AND pe.id_usuario = @id_usuario
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Pago no encontrado'
            });
        }

        res.json({
            pago: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener pago:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


module.exports = {
    crearPago,
    obtenerMisPagos,
    obtenerPagoPorId
};