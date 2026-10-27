const { sql, poolPromise } = require('../config/database');

// =====================================================
// CREAR CITA
// =====================================================

const crearCita = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const {
            id_servicio,
            id_horario,
            fecha,
            tipo_equipo,
            modelo,
            detalle_servicio,
            nombre_contacto,
            telefono,
            email
        } = req.body;

        // =================================================
        // VALIDACIONES
        // =================================================

        if (
            !id_servicio ||
            !id_horario ||
            !fecha ||
            !tipo_equipo ||
            !nombre_contacto ||
            !telefono
        ) {
            return res.status(400).json({
                mensaje:
                    'id_servicio, id_horario, fecha, tipo_equipo, nombre_contacto y telefono son obligatorios'
            });
        }

        const pool = await poolPromise;

        // =================================================
        // VERIFICAR FECHA
        // =================================================

        const fechaResult = await pool.request()
            .input('fecha', sql.Date, fecha)
            .query(`
                SELECT
                    @fecha AS fecha,
                    CAST(GETDATE() AS DATE) AS fecha_actual
            `);

        const fechaSeleccionada = fechaResult.recordset[0].fecha;
        const fechaActual = fechaResult.recordset[0].fecha_actual;

        if (fechaSeleccionada < fechaActual) {
            return res.status(400).json({
                mensaje: 'No se puede reservar una fecha anterior a la fecha actual'
            });
        }

        // =================================================
        // VERIFICAR SERVICIO
        // =================================================

        const servicioResult = await pool.request()
            .input('id_servicio', sql.Int, id_servicio)
            .query(`
                SELECT
                    id_servicio,
                    nombre,
                    activo
                FROM servicios
                WHERE id_servicio = @id_servicio
            `);

        if (servicioResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Servicio no encontrado'
            });
        }

        const servicio = servicioResult.recordset[0];

        if (!servicio.activo) {
            return res.status(400).json({
                mensaje: 'El servicio seleccionado no está disponible'
            });
        }

        // =================================================
        // VERIFICAR HORARIO
        // =================================================

        const horarioResult = await pool.request()
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

        if (horarioResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Horario no encontrado'
            });
        }

        const horario = horarioResult.recordset[0];

        if (!horario.activo) {
            return res.status(400).json({
                mensaje: 'El horario seleccionado no está disponible'
            });
        }

        // =================================================
        // VERIFICAR DISPONIBILIDAD
        // =================================================

        const citaExistente = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .input('fecha', sql.Date, fecha)
            .query(`
                SELECT TOP 1
                    id_cita,
                    estado
                FROM citas
                WHERE id_horario = @id_horario
                  AND fecha = @fecha
                  AND estado NOT IN ('CANCELADA')
            `);

        if (citaExistente.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'El horario seleccionado ya está reservado para esa fecha'
            });
        }

        // =================================================
        // CREAR CITA
        // =================================================

        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_servicio', sql.Int, id_servicio)
            .input('id_horario', sql.Int, id_horario)
            .input('fecha', sql.Date, fecha)
            .input('tipo_equipo', sql.VarChar(50), tipo_equipo)
            .input('modelo', sql.NVarChar(150), modelo || null)
            .input(
                'detalle_servicio',
                sql.NVarChar(1000),
                detalle_servicio || null
            )
            .input(
                'nombre_contacto',
                sql.NVarChar(150),
                nombre_contacto
            )
            .input(
                'telefono',
                sql.VarChar(20),
                telefono
            )
            .input(
                'email',
                sql.VarChar(150),
                email || null
            )
            .query(`
                INSERT INTO citas (
                    id_usuario,
                    id_servicio,
                    id_horario,
                    fecha,
                    tipo_equipo,
                    modelo,
                    detalle_servicio,
                    nombre_contacto,
                    telefono,
                    email
                )
                OUTPUT INSERTED.*
                VALUES (
                    @id_usuario,
                    @id_servicio,
                    @id_horario,
                    @fecha,
                    @tipo_equipo,
                    @modelo,
                    @detalle_servicio,
                    @nombre_contacto,
                    @telefono,
                    @email
                )
            `);

        res.status(201).json({
            mensaje: 'Cita registrada correctamente',
            cita: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear cita:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER MIS CITAS
// =====================================================

const obtenerMisCitas = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    c.id_cita,
                    c.id_servicio,
                    s.nombre AS servicio,
                    c.id_horario,
                    h.hora_inicio,
                    h.hora_fin,
                    c.fecha,
                    c.tipo_equipo,
                    c.modelo,
                    c.detalle_servicio,
                    c.nombre_contacto,
                    c.telefono,
                    c.email,
                    c.estado,
                    c.observaciones,
                    c.fecha_registro
                FROM citas c
                LEFT JOIN servicios s
                    ON c.id_servicio = s.id_servicio
                INNER JOIN horarios h
                    ON c.id_horario = h.id_horario
                WHERE c.id_usuario = @id_usuario
                ORDER BY c.fecha DESC, h.hora_inicio ASC
            `);

        res.json({
            citas: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener mis citas:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER TODAS LAS CITAS - ADMIN
// =====================================================

const obtenerTodasLasCitas = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                c.id_cita,
                c.id_usuario,
                u.nombre_completo AS usuario,
                c.id_servicio,
                s.nombre AS servicio,
                c.id_horario,
                h.hora_inicio,
                h.hora_fin,
                c.fecha,
                c.tipo_equipo,
                c.modelo,
                c.detalle_servicio,
                c.nombre_contacto,
                c.telefono,
                c.email,
                c.estado,
                c.observaciones,
                c.fecha_registro
            FROM citas c
            LEFT JOIN usuarios u
                ON c.id_usuario = u.id_usuario
            LEFT JOIN servicios s
                ON c.id_servicio = s.id_servicio
            INNER JOIN horarios h
                ON c.id_horario = h.id_horario
            ORDER BY c.fecha DESC, h.hora_inicio ASC
        `);

        res.json({
            citas: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener todas las citas:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// OBTENER CITA POR ID
// =====================================================

const obtenerCitaPorId = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const id_cita = parseInt(req.params.id);

        if (isNaN(id_cita)) {
            return res.status(400).json({
                mensaje: 'El ID de la cita debe ser numérico'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_cita', sql.Int, id_cita)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT
                    c.id_cita,
                    c.id_usuario,
                    c.id_servicio,
                    s.nombre AS servicio,
                    c.id_horario,
                    h.hora_inicio,
                    h.hora_fin,
                    c.fecha,
                    c.tipo_equipo,
                    c.modelo,
                    c.detalle_servicio,
                    c.nombre_contacto,
                    c.telefono,
                    c.email,
                    c.estado,
                    c.observaciones,
                    c.fecha_registro
                FROM citas c
                LEFT JOIN servicios s
                    ON c.id_servicio = s.id_servicio
                INNER JOIN horarios h
                    ON c.id_horario = h.id_horario
                WHERE c.id_cita = @id_cita
                  AND c.id_usuario = @id_usuario
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Cita no encontrada'
            });
        }

        res.json({
            cita: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener cita:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ACTUALIZAR CITA
// =====================================================

const actualizarCita = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const id_rol = req.usuario.id_rol;
        const id_cita = parseInt(req.params.id);

        if (isNaN(id_cita)) {
            return res.status(400).json({
                mensaje: 'El ID de la cita debe ser numérico'
            });
        }

        const {
            id_servicio,
            id_horario,
            fecha,
            tipo_equipo,
            modelo,
            detalle_servicio,
            nombre_contacto,
            telefono,
            email,
            estado,
            observaciones
        } = req.body;

        if (
            !id_servicio ||
            !id_horario ||
            !fecha ||
            !tipo_equipo ||
            !nombre_contacto ||
            !telefono
        ) {
            return res.status(400).json({
                mensaje:
                    'id_servicio, id_horario, fecha, tipo_equipo, nombre_contacto y telefono son obligatorios'
            });
        }

        const pool = await poolPromise;

        // =================================================
        // VERIFICAR PROPIEDAD DE LA CITA
        // =================================================

        const citaActual = await pool.request()
            .input('id_cita', sql.Int, id_cita)
            .query(`
                SELECT
                    id_cita,
                    id_usuario
                FROM citas
                WHERE id_cita = @id_cita
            `);

        if (citaActual.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Cita no encontrada'
            });
        }

        const cita = citaActual.recordset[0];

        if (
            id_rol !== 1 &&
            cita.id_usuario !== id_usuario
        ) {
            return res.status(403).json({
                mensaje: 'No tienes permiso para modificar esta cita'
            });
        }

        // =================================================
        // VERIFICAR FECHA
        // =================================================

        const fechaResult = await pool.request()
            .input('fecha', sql.Date, fecha)
            .query(`
                SELECT
                    @fecha AS fecha,
                    CAST(GETDATE() AS DATE) AS fecha_actual
            `);

        if (
            fechaResult.recordset[0].fecha <
            fechaResult.recordset[0].fecha_actual
        ) {
            return res.status(400).json({
                mensaje: 'No se puede utilizar una fecha anterior a la fecha actual'
            });
        }

        // =================================================
        // VERIFICAR SERVICIO
        // =================================================

        const servicioResult = await pool.request()
            .input('id_servicio', sql.Int, id_servicio)
            .query(`
                SELECT id_servicio, activo
                FROM servicios
                WHERE id_servicio = @id_servicio
            `);

        if (servicioResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Servicio no encontrado'
            });
        }

        if (!servicioResult.recordset[0].activo) {
            return res.status(400).json({
                mensaje: 'El servicio seleccionado no está disponible'
            });
        }

        // =================================================
        // VERIFICAR HORARIO
        // =================================================

        const horarioResult = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .query(`
                SELECT id_horario, activo
                FROM horarios
                WHERE id_horario = @id_horario
            `);

        if (horarioResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Horario no encontrado'
            });
        }

        if (!horarioResult.recordset[0].activo) {
            return res.status(400).json({
                mensaje: 'El horario seleccionado no está disponible'
            });
        }

        // =================================================
        // VERIFICAR DISPONIBILIDAD
        // =================================================

        const citaExistente = await pool.request()
            .input('id_horario', sql.Int, id_horario)
            .input('fecha', sql.Date, fecha)
            .input('id_cita', sql.Int, id_cita)
            .query(`
                SELECT TOP 1
                    id_cita
                FROM citas
                WHERE id_horario = @id_horario
                  AND fecha = @fecha
                  AND id_cita <> @id_cita
                  AND estado NOT IN ('CANCELADA')
            `);

        if (citaExistente.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'El horario seleccionado ya está reservado para esa fecha'
            });
        }

        // =================================================
        // ESTADO
        // =================================================

        let nuevoEstado = estado;

        if (id_rol !== 1) {
            // El cliente no puede modificar el estado
            nuevoEstado = 'PENDIENTE';
        }

        if (!nuevoEstado) {
            nuevoEstado = 'PENDIENTE';
        }

        const result = await pool.request()
            .input('id_cita', sql.Int, id_cita)
            .input('id_servicio', sql.Int, id_servicio)
            .input('id_horario', sql.Int, id_horario)
            .input('fecha', sql.Date, fecha)
            .input('tipo_equipo', sql.VarChar(50), tipo_equipo)
            .input('modelo', sql.NVarChar(150), modelo || null)
            .input(
                'detalle_servicio',
                sql.NVarChar(1000),
                detalle_servicio || null
            )
            .input(
                'nombre_contacto',
                sql.NVarChar(150),
                nombre_contacto
            )
            .input('telefono', sql.VarChar(20), telefono)
            .input('email', sql.VarChar(150), email || null)
            .input('estado', sql.VarChar(30), nuevoEstado)
            .input(
                'observaciones',
                sql.NVarChar(500),
                observaciones || null
            )
            .query(`
                UPDATE citas
                SET
                    id_servicio = @id_servicio,
                    id_horario = @id_horario,
                    fecha = @fecha,
                    tipo_equipo = @tipo_equipo,
                    modelo = @modelo,
                    detalle_servicio = @detalle_servicio,
                    nombre_contacto = @nombre_contacto,
                    telefono = @telefono,
                    email = @email,
                    estado = @estado,
                    observaciones = @observaciones
                OUTPUT INSERTED.*
                WHERE id_cita = @id_cita
            `);

        res.json({
            mensaje: 'Cita actualizada correctamente',
            cita: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar cita:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


// =====================================================
// ELIMINAR / CANCELAR CITA
// =====================================================

const eliminarCita = async (req, res) => {
    try {
        const id_usuario = req.usuario.id_usuario;
        const id_rol = req.usuario.id_rol;
        const id_cita = parseInt(req.params.id);

        if (isNaN(id_cita)) {
            return res.status(400).json({
                mensaje: 'El ID de la cita debe ser numérico'
            });
        }

        const pool = await poolPromise;

        const citaResult = await pool.request()
            .input('id_cita', sql.Int, id_cita)
            .query(`
                SELECT
                    id_cita,
                    id_usuario,
                    estado
                FROM citas
                WHERE id_cita = @id_cita
            `);

        if (citaResult.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Cita no encontrada'
            });
        }

        const cita = citaResult.recordset[0];

        if (
            id_rol !== 1 &&
            cita.id_usuario !== id_usuario
        ) {
            return res.status(403).json({
                mensaje: 'No tienes permiso para cancelar esta cita'
            });
        }

        // En lugar de borrar físicamente la cita,
        // la marcamos como CANCELADA.
        await pool.request()
            .input('id_cita', sql.Int, id_cita)
            .query(`
                UPDATE citas
                SET estado = 'CANCELADA'
                WHERE id_cita = @id_cita
            `);

        res.json({
            mensaje: 'Cita cancelada correctamente'
        });

    } catch (error) {
        console.error('Error al cancelar cita:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};


module.exports = {
    crearCita,
    obtenerMisCitas,
    obtenerTodasLasCitas,
    obtenerCitaPorId,
    actualizarCita,
    eliminarCita
};