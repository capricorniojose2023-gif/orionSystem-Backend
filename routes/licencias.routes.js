const express = require('express');


const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const {
    obtenerLicencias,
    obtenerLicencia,
    crearLicencia,
    actualizarLicencia,
    eliminarLicencia
} = require('../controllers/licencias.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Licencias
 *   description: Gestión de licencias de software
 */

/**
 * @swagger
 * /api/licencias:
 *   get:
 *     summary: Obtener todas las licencias
 *     tags: [Licencias]
 *     responses:
 *       200:
 *         description: Lista de licencias obtenida correctamente
 *       500:
 *         description: Error del servidor
 */
router.get('/', obtenerLicencias);

/**
 * @swagger
 * /api/licencias/{id}:
 *   get:
 *     summary: Obtener una licencia por ID
 *     tags: [Licencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la licencia
 *     responses:
 *       200:
 *         description: Licencia encontrada
 *       404:
 *         description: Licencia no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', obtenerLicencia);

/**
 * @swagger
 * /api/licencias:
 *   post:
 *     summary: Crear una nueva licencia
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - software
 *               - precio
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Microsoft Office 2026
 *               software:
 *                 type: string
 *                 example: OFFICE
 *               descripcion:
 *                 type: string
 *                 example: Licencia digital de Microsoft Office 2026
 *               precio:
 *                 type: number
 *                 example: 119.99
 *               duracion_meses:
 *                 type: integer
 *                 example: 12
 *               stock:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Licencia creada correctamente
 *       400:
 *         description: Datos obligatorios faltantes
 *       500:
 *         description: Error del servidor
 */
router.post(
    '/',
    verificarToken,
    verificarAdministrador,
    crearLicencia
);

/**
 * @swagger
 * /api/licencias/{id}:
 *   put:
 *     summary: Actualizar una licencia
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la licencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Microsoft Office 2026
 *               software:
 *                 type: string
 *                 example: OFFICE
 *               descripcion:
 *                 type: string
 *                 example: Licencia digital actualizada
 *               precio:
 *                 type: number
 *                 example: 129.99
 *               duracion_meses:
 *                 type: integer
 *                 example: 12
 *               stock:
 *                 type: integer
 *                 example: 15
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Licencia actualizada correctamente
 *       404:
 *         description: Licencia no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put(
    '/:id',
    verificarToken,
    verificarAdministrador,
    actualizarLicencia
);

/**
 * @swagger
 * /api/licencias/{id}:
 *   delete:
 *     summary: Eliminar una licencia
 *     tags: [Licencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la licencia
 *     responses:
 *       200:
 *         description: Licencia eliminada correctamente
 *       404:
 *         description: Licencia no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete(
    '/:id',
    verificarToken,
    verificarAdministrador,
    eliminarLicencia
);

module.exports = router;