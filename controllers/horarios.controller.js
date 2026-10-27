const { sql, poolPromise } = require('../config/database');

// =====================================================
// OBTENER TODOS LOS HORARIOS
// =====================================================

const obtenerHorarios = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                id_horario,
                hora_inicio,
                hora_fin,
                activo
            FROM horarios
            ORDER BY hora_inicio ASC
        `);

        res.json({
            horarios: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener horarios:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER HORARIO POR ID
// =====================================================

const obtenerHorarioPorId = async (req, res) => {
    try {
        const id_horario = parseInt(req.params.id);

        if (isNaN(id_horario)) {
            return res.status(400).json({
                mensaje: 'El ID del horario debe ser numérico'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .query(`
                SELECT
                    id_horario,
                    hora_inicio,
                    hora_fin,
                    activo
                FROM horarios
                WHERE id_horario = @id_horario
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Horario no encontrado'
            });
        }

        res.json({
            horario: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener horario:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// CREAR HORARIO
// =====================================================

const crearHorario = async (req, res) => {
    try {
        const {
            hora_inicio,
            hora_fin,
            activo
        } = req.body;

        if (!hora_inicio) {
            return res.status(400).json({
                mensaje: 'hora_inicio es obligatorio'
            });
        }

        if (
            hora_fin &&
            hora_fin <= hora_inicio
        ) {
            return res.status(400).json({
                mensaje: 'hora_fin debe ser posterior a hora_inicio'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('hora_inicio', sql.VarChar(8), hora_inicio)
            .input(
                'hora_fin',
                sql.VarChar(8),
                hora_fin || null
            )
            .input(
                'activo',
                sql.Bit,
                activo !== undefined ? activo : true
            )
            .query(`
                INSERT INTO horarios (
                    hora_inicio,
                    hora_fin,
                    activo
                )
                OUTPUT INSERTED.*
                VALUES (
                    CAST(@hora_inicio AS TIME),
                    CAST(@hora_fin AS TIME),
                    @activo
                )
            `);

        res.status(201).json({
            mensaje: 'Horario creado correctamente',
            horario: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear horario:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ACTUALIZAR HORARIO
// =====================================================

const actualizarHorario = async (req, res) => {
    try {
        const id_horario = parseInt(req.params.id);

        if (isNaN(id_horario)) {
            return res.status(400).json({
                mensaje: 'El ID del horario debe ser numérico'
            });
        }

        const {
            hora_inicio,
            hora_fin,
            activo
        } = req.body;

        if (!hora_inicio) {
            return res.status(400).json({
                mensaje: 'hora_inicio es obligatorio'
            });
        }

        if (
            hora_fin &&
            hora_fin <= hora_inicio
        ) {
            return res.status(400).json({
                mensaje: 'hora_fin debe ser posterior a hora_inicio'
            });
        }

        const pool = await poolPromise;

        const existe = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .query(`
                SELECT id_horario
                FROM horarios
                WHERE id_horario = @id_horario
            `);

        if (existe.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Horario no encontrado'
            });
        }

        const result = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .input('hora_inicio', sql.VarChar(8), hora_inicio)
            .input(
                'hora_fin',
                sql.VarChar(8),
                hora_fin || null
            )
            .input('activo', sql.Bit, activo)
            .query(`
                UPDATE horarios
                SET
                    hora_inicio = CAST(@hora_inicio AS TIME),
                    hora_fin = CAST(@hora_fin AS TIME),
                    activo = @activo
                OUTPUT INSERTED.*
                WHERE id_horario = @id_horario
            `);

        res.json({
            mensaje: 'Horario actualizado correctamente',
            horario: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar horario:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ELIMINAR HORARIO
// =====================================================

const eliminarHorario = async (req, res) => {
    try {
        const id_horario = parseInt(req.params.id);

        if (isNaN(id_horario)) {
            return res.status(400).json({
                mensaje: 'El ID del horario debe ser numérico'
            });
        }

        const pool = await poolPromise;

        const existe = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .query(`
                SELECT id_horario
                FROM horarios
                WHERE id_horario = @id_horario
            `);

        if (existe.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Horario no encontrado'
            });
        }

        // Verificar si existen citas relacionadas
        const citas = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .query(`
                SELECT COUNT(*) AS cantidad
                FROM citas
                WHERE id_horario = @id_horario
            `);

        if (citas.recordset[0].cantidad > 0) {
            return res.status(409).json({
                mensaje: 'No se puede eliminar el horario porque tiene citas relacionadas'
            });
        }

        await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .query(`
                DELETE FROM horarios
                WHERE id_horario = @id_horario
            `);

        res.json({
            mensaje: 'Horario eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar horario:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


module.exports = {
    obtenerHorarios,
    obtenerHorarioPorId,
    crearHorario,
    actualizarHorario,
    eliminarHorario
};