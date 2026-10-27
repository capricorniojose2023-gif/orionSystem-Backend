const { sql, poolPromise } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==========================================
// LOGIN
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                mensaje: 'El correo y la contraseña son obligatorios'
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('email', sql.VarChar(150), email)
            .query(`
                SELECT
                    u.id_usuario,
                    u.id_rol,
                    u.nombre_completo,
                    u.email,
                    u.password_hash,
                    u.telefono,
                    u.activo,
                    u.acepta_terminos,
                    r.nombre AS rol
                FROM usuarios u
                INNER JOIN roles r
                    ON u.id_rol = r.id_rol
                WHERE u.email = @email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = result.recordset[0];

        if (!usuario.activo) {
            return res.status(403).json({
                mensaje: 'El usuario se encuentra inactivo'
            });
        }

        const passwordValida = await bcrypt.compare(
            password,
            usuario.password_hash
        );

        if (!passwordValida) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                id_rol: usuario.id_rol,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        await pool.request()
            .input('id_usuario', sql.Int, usuario.id_usuario)
            .query(`
                UPDATE usuarios
                SET ultimo_acceso = SYSDATETIME()
                WHERE id_usuario = @id_usuario
            `);

        res.json({
            mensaje: 'Inicio de sesión correcto',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                id_rol: usuario.id_rol,
                rol: usuario.rol,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                telefono: usuario.telefono
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ==========================================
// REGISTRAR USUARIO
// ==========================================
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password, acepta_terminos } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({
                mensaje: 'Todos los campos obligatorios deben ser completados'
            });
        }

        const pool = await poolPromise;

        const usuarioExistente = await pool.request()
            .input('email', sql.VarChar(150), email)
            .query('SELECT id_usuario FROM usuarios WHERE email = @email');

        if (usuarioExistente.recordset.length > 0) {
            return res.status(409).json({
                mensaje: 'El correo electrónico ya se encuentra registrado'
            });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const id_rol = 2; 
        const activo = true;
        const aceptaTerminosValor = acepta_terminos !== undefined ? acepta_terminos : true;

        await pool.request()
            .input('id_rol', sql.Int, id_rol)
            .input('nombre_completo', sql.VarChar(150), nombre)
            .input('email', sql.VarChar(150), email)
            .input('password_hash', sql.VarChar(255), password_hash)
            .input('activo', sql.Bit, activo)
            .input('acepta_terminos', sql.Bit, aceptaTerminosValor)
            .query(`
                INSERT INTO usuarios (id_rol, nombre_completo, email, password_hash, activo, acepta_terminos, fecha_registro)
                VALUES (@id_rol, @nombre_completo, @email, @password_hash, @activo, @acepta_terminos, SYSDATETIME())
            `);

        return res.status(201).json({
            mensaje: 'Usuario registrado correctamente'
        });

    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ==========================================
// GOOGLE LOGIN
// ==========================================
const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ mensaje: 'Token de Google no proporcionado' });
        }

        // Consultar los datos del usuario en Google usando el access_token
        const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!googleResponse.ok) {
            return res.status(401).json({ mensaje: 'Token de Google inválido o expirado' });
        }

        const googleUser = await googleResponse.json();
        const { email, name } = googleUser;

        if (!email) {
            return res.status(400).json({ mensaje: 'No se pudo obtener el correo de Google' });
        }

        const pool = await poolPromise;

        // Verificar si el usuario ya existe en SQL Server
        let result = await pool.request()
            .input('email', sql.VarChar(150), email)
            .query(`
                SELECT 
                    u.id_usuario,
                    u.id_rol,
                    u.nombre_completo,
                    u.email,
                    u.telefono,
                    u.activo,
                    r.nombre AS rol
                FROM usuarios u
                INNER JOIN roles r ON u.id_rol = r.id_rol
                WHERE u.email = @email
            `);

        let usuario;

        if (result.recordset.length === 0) {
            // Si el usuario no existe, lo registramos automáticamente con Google
            const id_rol = 2; // Rol CLIENTE por defecto
            const password_hash = ''; // Sin contraseña local
            const activo = true;
            const acepta_terminos = true;

            await pool.request()
                .input('id_rol', sql.Int, id_rol)
                .input('nombre_completo', sql.VarChar(150), name || 'Usuario Google')
                .input('email', sql.VarChar(150), email)
                .input('password_hash', sql.VarChar(255), password_hash)
                .input('activo', sql.Bit, activo)
                .input('acepta_terminos', sql.Bit, acepta_terminos)
                .query(`
                    INSERT INTO usuarios (id_rol, nombre_completo, email, password_hash, activo, acepta_terminos, fecha_registro)
                    VALUES (@id_rol, @nombre_completo, @email, @password_hash, @activo, @acepta_terminos, SYSDATETIME())
                `);

            // Consultar de nuevo para obtener el registro completo
            result = await pool.request()
                .input('email', sql.VarChar(150), email)
                .query(`
                    SELECT 
                        u.id_usuario,
                        u.id_rol,
                        u.nombre_completo,
                        u.email,
                        u.telefono,
                        u.activo,
                        r.nombre AS rol
                    FROM usuarios u
                    INNER JOIN roles r ON u.id_rol = r.id_rol
                    WHERE u.email = @email
                `);
        }

        usuario = result.recordset[0];

        if (!usuario.activo) {
            return res.status(403).json({ mensaje: 'El usuario se encuentra inactivo' });
        }

        // Generar token JWT de la aplicación
        const jwtToken = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                id_rol: usuario.id_rol,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Actualizar último acceso
        await pool.request()
            .input('id_usuario', sql.Int, usuario.id_usuario)
            .query(`
                UPDATE usuarios
                SET ultimo_acceso = SYSDATETIME()
                WHERE id_usuario = @id_usuario
            `);

        res.json({
            mensaje: 'Inicio de sesión con Google exitoso',
            token: jwtToken,
            usuario: {
                id_usuario: usuario.id_usuario,
                id_rol: usuario.id_rol,
                rol: usuario.rol,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                telefono: usuario.telefono
            }
        });

    } catch (error) {
        console.error('Error en googleLogin:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor al procesar Google login',
            error: error.message
        });
    }
};

module.exports = {
    login,
    registrarUsuario,
    googleLogin
};