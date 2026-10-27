const jwt = require('jsonwebtoken');

// ==========================================
// VERIFICAR TOKEN JWT
// ==========================================
const verificarToken = (req, res, next) => {
    try {
        // Obtener Authorization del encabezado
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                mensaje: 'Token de autenticación requerido'
            });
        }

        // Formato esperado:
        // Authorization: Bearer TOKEN
        const partes = authHeader.split(' ');

        if (partes.length !== 2 || partes[0] !== 'Bearer') {
            return res.status(401).json({
                mensaje: 'Formato de token inválido'
            });
        }

        const token = partes[1];

        // Verificar token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guardar información del usuario
        // para que los siguientes controladores puedan utilizarla
        req.usuario = decoded;

        next();

    } catch (error) {
        console.error('Error verificando token:', error.message);

        return res.status(401).json({
            mensaje: 'Token inválido o expirado'
        });
    }
};


// ==========================================
// VERIFICAR ROL DE ADMINISTRADOR
// ==========================================
const verificarAdministrador = (req, res, next) => {

    if (!req.usuario) {
        return res.status(401).json({
            mensaje: 'Usuario no autenticado'
        });
    }

    if (req.usuario.id_rol !== 1) {
        return res.status(403).json({
            mensaje: 'Acceso denegado. Se requiere rol de administrador'
        });
    }

    next();
};


module.exports = {
    verificarToken,
    verificarAdministrador
};
