const { sql, poolPromise } = require('../config/database');

// ==========================================
// GET TODOS LOS USUARIOS
// ==========================================
const obtenerUsuarios = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .query(`
                SELECT
                    id_usuario,
                    id_rol,
                    nombre_completo,
                    email,
                    google_id,
                    telefono,
                    activo,
                    acepta_terminos,
                    fecha_registro,
                    ultimo_acceso
                FROM usuarios
                ORDER BY id_usuario DESC
            `);

        res.json({
            ok: true,
            cantidad: resultado.recordset.length,
            datos: resultado.recordset
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener los usuarios',
            error: error.message
        });
    }
};


// ==========================================
// GET USUARIO POR ID
// ==========================================
const obtenerUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    id_usuario,
                    id_rol,
                    nombre_completo,
                    email,
                    google_id,
                    telefono,
                    activo,
                    acepta_terminos,
                    fecha_registro,
                    ultimo_acceso
                FROM usuarios
                WHERE id_usuario = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            ok: true,
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener el usuario',
            error: error.message
        });
    }
};


// ==========================================
// CREAR USUARIO
// ==========================================
const crearUsuario = async (req, res) => {
    try {
        const {
            id_usuario,
            id_rol,
            nombre_completo,
            email,
            password_hash,
            google_id,
            telefono,
            activo,
            acepta_terminos
        } = req.body;

        if (
            id_usuario === undefined ||
            id_rol === undefined ||
            !nombre_completo ||
            !email
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'id_usuario, id_rol, nombre_completo y email son obligatorios'
            });
        }

        const pool = await poolPromise;

        // Verificar si ya existe el ID
        const existeId = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                SELECT id_usuario
                FROM usuarios
                WHERE id_usuario = @id_usuario
            `);

        if (existeId.recordset.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un usuario con ese ID'
            });
        }

        // Verificar si ya existe el correo
        const existeEmail = await pool.request()
            .input('email', sql.VarChar(150), email)
            .query(`
                SELECT id_usuario
                FROM usuarios
                WHERE email = @email
            `);

        if (existeEmail.recordset.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un usuario con ese correo electrónico'
            });
        }

        const resultado = await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('id_rol', sql.Int, id_rol)
            .input('nombre_completo', sql.NVarChar(150), nombre_completo)
            .input('email', sql.VarChar(150), email)
            .input('password_hash', sql.VarChar(255), password_hash || null)
            .input('google_id', sql.VarChar(255), google_id || null)
            .input('telefono', sql.VarChar(20), telefono || null)
            .input('activo', sql.Bit, activo ?? true)
            .input('acepta_terminos', sql.Bit, acepta_terminos ?? false)
            .query(`
                INSERT INTO usuarios
                (
                    id_usuario,
                    id_rol,
                    nombre_completo,
                    email,
                    password_hash,
                    google_id,
                    telefono,
                    activo,
                    acepta_terminos
                )
                OUTPUT
                    INSERTED.id_usuario,
                    INSERTED.id_rol,
                    INSERTED.nombre_completo,
                    INSERTED.email,
                    INSERTED.google_id,
                    INSERTED.telefono,
                    INSERTED.activo,
                    INSERTED.acepta_terminos,
                    INSERTED.fecha_registro,
                    INSERTED.ultimo_acceso
                VALUES
                (
                    @id_usuario,
                    @id_rol,
                    @nombre_completo,
                    @email,
                    @password_hash,
                    @google_id,
                    @telefono,
                    @activo,
                    @acepta_terminos
                )
            `);

        res.status(201).json({
            ok: true,
            mensaje: 'Usuario creado correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear el usuario',
            error: error.message
        });
    }
};


// ==========================================
// ACTUALIZAR USUARIO
// ==========================================
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_rol,
            nombre_completo,
            email,
            password_hash,
            google_id,
            telefono,
            activo,
            acepta_terminos
        } = req.body;

        if (
            id_rol === undefined ||
            !nombre_completo ||
            !email
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'id_rol, nombre_completo y email son obligatorios'
            });
        }

        const pool = await poolPromise;

        // Verificar que el usuario exista
        const existeUsuario = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id_usuario
                FROM usuarios
                WHERE id_usuario = @id
            `);

        if (existeUsuario.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // Verificar que el email no pertenezca a otro usuario
        const existeEmail = await pool.request()
            .input('email', sql.VarChar(150), email)
            .input('id', sql.Int, id)
            .query(`
                SELECT id_usuario
                FROM usuarios
                WHERE email = @email
                AND id_usuario <> @id
            `);

        if (existeEmail.recordset.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'El correo electrónico ya está siendo utilizado por otro usuario'
            });
        }

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('id_rol', sql.Int, id_rol)
            .input('nombre_completo', sql.NVarChar(150), nombre_completo)
            .input('email', sql.VarChar(150), email)
            .input('password_hash', sql.VarChar(255), password_hash || null)
            .input('google_id', sql.VarChar(255), google_id || null)
            .input('telefono', sql.VarChar(20), telefono || null)
            .input('activo', sql.Bit, activo ?? true)
            .input('acepta_terminos', sql.Bit, acepta_terminos ?? false)
            .query(`
                UPDATE usuarios
                SET
                    id_rol = @id_rol,
                    nombre_completo = @nombre_completo,
                    email = @email,
                    password_hash = @password_hash,
                    google_id = @google_id,
                    telefono = @telefono,
                    activo = @activo,
                    acepta_terminos = @acepta_terminos
                OUTPUT
                    INSERTED.id_usuario,
                    INSERTED.id_rol,
                    INSERTED.nombre_completo,
                    INSERTED.email,
                    INSERTED.google_id,
                    INSERTED.telefono,
                    INSERTED.activo,
                    INSERTED.acepta_terminos,
                    INSERTED.fecha_registro,
                    INSERTED.ultimo_acceso
                WHERE id_usuario = @id
            `);

        res.json({
            ok: true,
            mensaje: 'Usuario actualizado correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar el usuario',
            error: error.message
        });
    }
};


// ==========================================
// ELIMINAR USUARIO
// ==========================================
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM usuarios
                OUTPUT
                    DELETED.id_usuario,
                    DELETED.id_rol,
                    DELETED.nombre_completo,
                    DELETED.email
                WHERE id_usuario = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Usuario eliminado correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'No se puede eliminar el usuario. Puede estar siendo utilizado por otras tablas.',
            error: error.message
        });
    }
};


module.exports = {
    obtenerUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};

