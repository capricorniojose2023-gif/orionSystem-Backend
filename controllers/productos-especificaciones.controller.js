const { sql, poolPromise } = require('../config/database');

// =====================================================
// OBTENER TODAS LAS ESPECIFICACIONES
// =====================================================
const obtenerEspecificaciones = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                pe.id_especificacion,
                pe.id_producto,
                p.nombre AS producto,
                pe.nombre,
                pe.valor,
                pe.orden
            FROM producto_especificaciones pe
            INNER JOIN productos p
                ON pe.id_producto = p.id_producto
            ORDER BY pe.id_producto, pe.orden, pe.id_especificacion
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error('Error obteniendo especificaciones:', error);

        res.status(500).json({
            mensaje: 'Error al obtener las especificaciones',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER ESPECIFICACIONES DE UN PRODUCTO
// =====================================================
const obtenerEspecificacionesPorProducto = async (req, res) => {
    try {
        const { id_producto } = req.params;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_producto', sql.Int, id_producto)
            .query(`
                SELECT
                    id_especificacion,
                    id_producto,
                    nombre,
                    valor,
                    orden
                FROM producto_especificaciones
                WHERE id_producto = @id_producto
                ORDER BY orden, id_especificacion
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error('Error obteniendo especificaciones del producto:', error);

        res.status(500).json({
            mensaje: 'Error al obtener las especificaciones del producto',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER UNA ESPECIFICACIÓN POR ID
// =====================================================
const obtenerEspecificacionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    pe.id_especificacion,
                    pe.id_producto,
                    p.nombre AS producto,
                    pe.nombre,
                    pe.valor,
                    pe.orden
                FROM producto_especificaciones pe
                INNER JOIN productos p
                    ON pe.id_producto = p.id_producto
                WHERE pe.id_especificacion = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Especificación no encontrada'
            });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('Error obteniendo especificación:', error);

        res.status(500).json({
            mensaje: 'Error al obtener la especificación',
            error: error.message
        });
    }
};


// =====================================================
// CREAR ESPECIFICACIÓN
// =====================================================
const crearEspecificacion = async (req, res) => {
    try {
        const {
            id_producto,
            nombre,
            valor,
            orden
        } = req.body;

        if (!id_producto || !nombre || !valor) {
            return res.status(400).json({
                mensaje: 'id_producto, nombre y valor son obligatorios'
            });
        }

        const pool = await poolPromise;

        // Verificar que el producto exista
        const producto = await pool.request()
            .input('id_producto', sql.Int, id_producto)
            .query(`
                SELECT id_producto
                FROM productos
                WHERE id_producto = @id_producto
            `);

        if (producto.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'El producto no existe'
            });
        }

        const result = await pool.request()
            .input('id_producto', sql.Int, id_producto)
            .input('nombre', sql.VarChar(100), nombre)
            .input('valor', sql.VarChar(200), valor)
            .input('orden', sql.Int, orden ?? 1)
            .query(`
                INSERT INTO producto_especificaciones
                (
                    id_producto,
                    nombre,
                    valor,
                    orden
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @id_producto,
                    @nombre,
                    @valor,
                    @orden
                )
            `);

        res.status(201).json({
            mensaje: 'Especificación creada correctamente',
            especificacion: result.recordset[0]
        });

    } catch (error) {
        console.error('Error creando especificación:', error);

        res.status(500).json({
            mensaje: 'Error al crear la especificación',
            error: error.message
        });
    }
};


// =====================================================
// ACTUALIZAR ESPECIFICACIÓN
// =====================================================
const actualizarEspecificacion = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_producto,
            nombre,
            valor,
            orden
        } = req.body;

        if (!id_producto || !nombre || !valor) {
            return res.status(400).json({
                mensaje: 'id_producto, nombre y valor son obligatorios'
            });
        }

        const pool = await poolPromise;

        const existente = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id_especificacion
                FROM producto_especificaciones
                WHERE id_especificacion = @id
            `);

        if (existente.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Especificación no encontrada'
            });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('id_producto', sql.Int, id_producto)
            .input('nombre', sql.VarChar(100), nombre)
            .input('valor', sql.VarChar(200), valor)
            .input('orden', sql.Int, orden ?? 1)
            .query(`
                UPDATE producto_especificaciones
                SET
                    id_producto = @id_producto,
                    nombre = @nombre,
                    valor = @valor,
                    orden = @orden
                OUTPUT INSERTED.*
                WHERE id_especificacion = @id
            `);

        res.json({
            mensaje: 'Especificación actualizada correctamente',
            especificacion: result.recordset[0]
        });

    } catch (error) {
        console.error('Error actualizando especificación:', error);

        res.status(500).json({
            mensaje: 'Error al actualizar la especificación',
            error: error.message
        });
    }
};


// =====================================================
// ELIMINAR ESPECIFICACIÓN
// =====================================================
const eliminarEspecificacion = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM producto_especificaciones
                OUTPUT DELETED.*
                WHERE id_especificacion = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Especificación no encontrada'
            });
        }

        res.json({
            mensaje: 'Especificación eliminada correctamente',
            especificacion: result.recordset[0]
        });

    } catch (error) {
        console.error('Error eliminando especificación:', error);

        res.status(500).json({
            mensaje: 'Error al eliminar la especificación',
            error: error.message
        });
    }
};


module.exports = {
    obtenerEspecificaciones,
    obtenerEspecificacionesPorProducto,
    obtenerEspecificacionPorId,
    crearEspecificacion,
    actualizarEspecificacion,
    eliminarEspecificacion
};