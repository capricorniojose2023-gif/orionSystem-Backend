const { sql, poolPromise } = require('../config/database');

// ==========================================
// OBTENER TODOS LOS ROLES
// ==========================================
const obtenerRoles = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .query(`
                SELECT
                    id_rol,
                    nombre,
                    descripcion
                FROM roles
                ORDER BY id_rol
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error('Error al obtener roles:', error);

        res.status(500).json({
            mensaje: 'Error al obtener los roles',
            error: error.message
        });
    }
};


// ==========================================
// OBTENER UN ROL POR ID
// ==========================================
const obtenerRol = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El ID del rol debe ser un número'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('id_rol', sql.Int, id)
            .query(`
                SELECT
                    id_rol,
                    nombre,
                    descripcion
                FROM roles
                WHERE id_rol = @id_rol
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Rol no encontrado'
            });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('Error al obtener rol:', error);

        res.status(500).json({
            mensaje: 'Error al obtener el rol',
            error: error.message
        });
    }
};


// ==========================================
// CREAR ROL
// ==========================================
const crearRol = async (req, res) => {
    try {
        const {
            id_rol,
            nombre,
            descripcion
        } = req.body;

        if (
            id_rol === undefined ||
            id_rol === null ||
            !nombre
        ) {
            return res.status(400).json({
                mensaje: 'id_rol y nombre son obligatorios'
            });
        }

        const pool = await poolPromise;

        // Verificar si el ID ya existe
        const existeId = await pool.request()
            .input('id_rol', sql.Int, id_rol)
            .query(`
                SELECT id_rol
                FROM roles
                WHERE id_rol = @id_rol
            `);

        if (existeId.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'Ya existe un rol con ese ID'
            });
        }

        // Verificar si el nombre ya existe
        const existeNombre = await pool.request()
            .input('nombre', sql.VarChar(30), nombre)
            .query(`
                SELECT id_rol
                FROM roles
                WHERE nombre = @nombre
            `);

        if (existeNombre.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'Ya existe un rol con ese nombre'
            });
        }

        const result = await pool.request()
            .input('id_rol', sql.Int, id_rol)
            .input('nombre', sql.VarChar(30), nombre)
            .input('descripcion', sql.VarChar(150), descripcion || null)
            .query(`
                INSERT INTO roles (
                    id_rol,
                    nombre,
                    descripcion
                )
                OUTPUT INSERTED.*
                VALUES (
                    @id_rol,
                    @nombre,
                    @descripcion
                )
            `);

        res.status(201).json({
            mensaje: 'Rol creado correctamente',
            rol: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear rol:', error);

        res.status(500).json({
            mensaje: 'Error al crear el rol',
            error: error.message
        });
    }
};


// ==========================================
// ACTUALIZAR ROL
// ==========================================
const actualizarRol = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const {
            nombre,
            descripcion
        } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El ID del rol debe ser un número'
            });
        }

        if (!nombre) {
            return res.status(400).json({
                mensaje: 'El nombre es obligatorio'
            });
        }

        const pool = await poolPromise;

        // Verificar que el rol exista
        const existeRol = await pool.request()
            .input('id_rol', sql.Int, id)
            .query(`
                SELECT id_rol
                FROM roles
                WHERE id_rol = @id_rol
            `);

        if (existeRol.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Rol no encontrado'
            });
        }

        // Verificar nombre duplicado
        const existeNombre = await pool.request()
            .input('nombre', sql.VarChar(30), nombre)
            .input('id_rol', sql.Int, id)
            .query(`
                SELECT id_rol
                FROM roles
                WHERE nombre = @nombre
                AND id_rol <> @id_rol
            `);

        if (existeNombre.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'Ya existe otro rol con ese nombre'
            });
        }

        const result = await pool.request()
            .input('id_rol', sql.Int, id)
            .input('nombre', sql.VarChar(30), nombre)
            .input('descripcion', sql.VarChar(150), descripcion || null)
            .query(`
                UPDATE roles
                SET
                    nombre = @nombre,
                    descripcion = @descripcion
                OUTPUT INSERTED.*
                WHERE id_rol = @id_rol
            `);

        res.json({
            mensaje: 'Rol actualizado correctamente',
            rol: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar rol:', error);

        res.status(500).json({
            mensaje: 'Error al actualizar el rol',
            error: error.message
        });
    }
};


// ==========================================
// ELIMINAR ROL
// ==========================================
const eliminarRol = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                mensaje: 'El ID del rol debe ser un número'
            });
        }

        const pool = await poolPromise;

        // Verificar si existe
        const existeRol = await pool.request()
            .input('id_rol', sql.Int, id)
            .query(`
                SELECT
                    id_rol,
                    nombre,
                    descripcion
                FROM roles
                WHERE id_rol = @id_rol
            `);

        if (existeRol.recordset.length === 0) {
            return res.status(404).json({
                mensaje: 'Rol no encontrado'
            });
        }

        // Verificar si hay usuarios utilizando este rol
        const usuarios = await pool.request()
            .input('id_rol', sql.Int, id)
            .query(`
                SELECT COUNT(*) AS cantidad
                FROM usuarios
                WHERE id_rol = @id_rol
            `);

        if (usuarios.recordset[0].cantidad > 0) {
            return res.status(409).json({
                mensaje: 'No se puede eliminar el rol porque está siendo utilizado por usuarios'
            });
        }

        await pool.request()
            .input('id_rol', sql.Int, id)
            .query(`
                DELETE FROM roles
                WHERE id_rol = @id_rol
            `);

        res.json({
            mensaje: 'Rol eliminado correctamente',
            rol: existeRol.recordset[0]
        });

    } catch (error) {
        console.error('Error al eliminar rol:', error);

        res.status(500).json({
            mensaje: 'Error al eliminar el rol',
            error: error.message
        });
    }
};


module.exports = {
    obtenerRoles,
    obtenerRol,
    crearRol,
    actualizarRol,
    eliminarRol
};

