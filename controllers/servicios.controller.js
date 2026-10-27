const { sql, poolPromise } = require('../config/database');

// =====================================================
// OBTENER TODOS LOS SERVICIOS
// =====================================================

const obtenerServicios = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                id_servicio,
                nombre,
                categoria,
                descripcion,
                precio_desde,
                activo
            FROM servicios
            ORDER BY id_servicio DESC
        `);

        res.json({
            servicios: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener servicios:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER SERVICIO POR ID
// =====================================================

const obtenerServicioPorId = async (req, res) => {
    try {
        const id_servicio = parseInt(req.params.id);

        if (isNaN(id_servicio)) {
            return res.status(400).json({
                mensaje: 'El ID del servicio debe ser numérico'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_servicio', sql.Int, id_servicio)
            .query(`
                SELECT
                    id_servicio,
                    nombre,
                    categoria,
                    descripcion,
                    precio_desde,
                    activo
                FROM servicios
                WHERE id_servicio = @id_servicio
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Servicio no encontrado'
            });
        }

        res.json({
            servicio: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener servicio:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// CREAR SERVICIO
// =====================================================

const crearServicio = async (req, res) => {
    try {
        const {
            nombre,
            categoria,
            descripcion,
            precio_desde,
            activo
        } = req.body;

        if (!nombre || !categoria) {
            return res.status(400).json({
                mensaje: 'nombre y categoria son obligatorios'
            });
        }

        if (
            precio_desde !== undefined &&
            precio_desde !== null &&
            Number(precio_desde) < 0
        ) {
            return res.status(400).json({
                mensaje: 'precio_desde no puede ser negativo'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('nombre', sql.NVarChar(150), nombre)
            .input('categoria', sql.VarChar(50), categoria)
            .input(
                'descripcion',
                sql.NVarChar(500),
                descripcion || null
            )
            .input(
                'precio_desde',
                sql.Decimal(10, 2),
                precio_desde !== undefined && precio_desde !== null
                    ? precio_desde
                    : null
            )
            .input(
                'activo',
                sql.Bit,
                activo !== undefined ? activo : true
            )
            .query(`
                INSERT INTO servicios (
                    nombre,
                    categoria,
                    descripcion,
                    precio_desde,
                    activo
                )
                OUTPUT INSERTED.*
                VALUES (
                    @nombre,
                    @categoria,
                    @descripcion,
                    @precio_desde,
                    @activo
                )
            `);

        res.status(201).json({
            mensaje: 'Servicio creado correctamente',
            servicio: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear servicio:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ACTUALIZAR SERVICIO
// =====================================================

const actualizarServicio = async (req, res) => {
    try {
        const id_servicio = parseInt(req.params.id);

        if (isNaN(id_servicio)) {
            return res.status(400).json({
                mensaje: 'El ID del servicio debe ser numérico'
            });
        }

        const {
            nombre,
            categoria,
            descripcion,
            precio_desde,
            activo
        } = req.body;

        if (!nombre || !categoria) {
            return res.status(400).json({
                mensaje: 'nombre y categoria son obligatorios'
            });
        }

        if (
            precio_desde !== undefined &&
            precio_desde !== null &&
            Number(precio_desde) < 0
        ) {
            return res.status(400).json({
                mensaje: 'precio_desde no puede ser negativo'
            });
        }

        const pool = await poolPromise;

        const existe = await pool.request()
            .input('id_servicio', sql.Int, id_servicio)
            .query(`
                SELECT id_servicio
                FROM servicios
                WHERE id_servicio = @id_servicio
            `);

        if (existe.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Servicio no encontrado'
            });
        }

        const result = await pool.request()
            .input('id_servicio', sql.Int, id_servicio)
            .input('nombre', sql.NVarChar(150), nombre)
            .input('categoria', sql.VarChar(50), categoria)
            .input(
                'descripcion',
                sql.NVarChar(500),
                descripcion || null
            )
            .input(
                'precio_desde',
                sql.Decimal(10, 2),
                precio_desde !== undefined && precio_desde !== null
                    ? precio_desde
                    : null
            )
            .input('activo', sql.Bit, activo)
            .query(`
                UPDATE servicios
                SET
                    nombre = @nombre,
                    categoria = @categoria,
                    descripcion = @descripcion,
                    precio_desde = @precio_desde,
                    activo = @activo
                OUTPUT INSERTED.*
                WHERE id_servicio = @id_servicio
            `);

        res.json({
            mensaje: 'Servicio actualizado correctamente',
            servicio: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar servicio:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ELIMINAR SERVICIO
// =====================================================

const eliminarServicio = async (req, res) => {
    try {
        const id_servicio = parseInt(req.params.id);

        if (isNaN(id_servicio)) {
            return res.status(400).json({
                mensaje: 'El ID del servicio debe ser numérico'
            });
        }

        const pool = await poolPromise;

        const existe = await pool.request()
            .input('id_servicio', sql.Int, id_servicio)
            .query(`
                SELECT id_servicio
                FROM servicios
                WHERE id_servicio = @id_servicio
            `);

        if (existe.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Servicio no encontrado'
            });
        }

        await pool.request()
            .input('id_servicio', sql.Int, id_servicio)
            .query(`
                DELETE FROM servicios
                WHERE id_servicio = @id_servicio
            `);

        res.json({
            mensaje: 'Servicio eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar servicio:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


module.exports = {
    obtenerServicios,
    obtenerServicioPorId,
    crearServicio,
    actualizarServicio,
    eliminarServicio
};