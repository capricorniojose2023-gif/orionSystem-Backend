const express = require('express');

const {
    login,
    registrarUsuario,
    googleLogin // <-- 1. Importado correctamente aquí
} = require('../controllers/auth.controller');

const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const router = express.Router();

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================
router.post('/register', registrarUsuario);
router.post('/login', login);
router.post('/google', googleLogin); // <-- 2. Declarada correctamente aquí

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Inicio de sesión y autenticación de usuarios
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Luis Garcia
 *               email:
 *                 type: string
 *                 example: luchito@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos incompletos
 *       409:
 *         description: El correo ya está registrado
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@orionsystem.com
 *               password:
 *                 type: string
 *                 example: Admin123*
 *     responses:
 *       200:
 *         description: Inicio de sesión correcto
 *       400:
 *         description: Correo y contraseña obligatorios
 *       401:
 *         description: Correo o contraseña incorrectos
 *       403:
 *         description: Usuario inactivo
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        mensaje: 'Token válido',
        usuario: req.usuario
    });
});

/**
 * @swagger
 * /api/auth/admin:
 *   get:
 *     summary: Probar acceso exclusivo de administrador
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceso autorizado para administrador
 *       401:
 *         description: Token inválido o no proporcionado
 *       403:
 *         description: Se requiere rol de administrador
 */
router.get(
    '/admin',
    verificarToken,
    verificarAdministrador,
    (req, res) => {
        res.json({
            mensaje: 'Acceso autorizado para administrador',
            usuario: req.usuario
        });
    }
);

module.exports = router;