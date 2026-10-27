
const express = require('express');

const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const {
    obtenerUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/usuarios.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios de ORION SYSTEM
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *      - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get(
    '/',
    verificarToken,
    verificarAdministrador,
    obtenerUsuarios
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
    '/:id',
    verificarToken,
    verificarAdministrador,
    obtenerUsuario
);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *               - id_rol
 *               - nombre_completo
 *               - email
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 4
 *               id_rol:
 *                 type: integer
 *                 example: 2
 *               nombre_completo:
 *                 type: string
 *                 example: Carlos Ramirez
 *               email:
 *                 type: string
 *                 example: carlos@gmail.com
 *               password_hash:
 *                 type: string
 *                 example: HASH_CLIENTE_02
 *               google_id:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               telefono:
 *                 type: string
 *                 example: 999888777
 *               activo:
 *                 type: boolean
 *                 example: true
 *               acepta_terminos:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos obligatorios faltantes
 *       409:
 *         description: Usuario o correo ya existente
 */
router.post(
    '/',
    verificarToken,
    verificarAdministrador,
    crearUsuario
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_rol
 *               - nombre_completo
 *               - email
 *             properties:
 *               id_rol:
 *                 type: integer
 *                 example: 2
 *               nombre_completo:
 *                 type: string
 *                 example: Carlos Ramirez
 *               email:
 *                 type: string
 *                 example: carlos@gmail.com
 *               password_hash:
 *                 type: string
 *                 example: HASH_CLIENTE_02
 *               google_id:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               telefono:
 *                 type: string
 *                 example: 999888777
 *               activo:
 *                 type: boolean
 *                 example: true
 *               acepta_terminos:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Correo electrónico duplicado
 */
router.put(
    '/:id',
    verificarToken,
    verificarAdministrador,
    actualizarUsuario
);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: No se puede eliminar el usuario
 */
router.delete(
    '/:id',
    verificarToken,
    verificarAdministrador,
    eliminarUsuario
);

module.exports = router;

