const express = require('express');

const {
    obtenerHorarios,
    obtenerHorarioPorId,
    crearHorario,
    actualizarHorario,
    eliminarHorario
} = require('../controllers/horarios.controller');

const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Horarios
 *   description: Gestión de horarios para citas
 */

/**
 * @swagger
 * /api/horarios:
 *   get:
 *     summary: Obtener todos los horarios
 *     tags: [Horarios]
 *     responses:
 *       200:
 *         description: Lista de horarios
 */
router.get('/', obtenerHorarios);


/**
 * @swagger
 * /api/horarios/{id}:
 *   get:
 *     summary: Obtener un horario por ID
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario encontrado
 *       404:
 *         description: Horario no encontrado
 */
router.get('/:id', obtenerHorarioPorId);


/**
 * @swagger
 * /api/horarios:
 *   post:
 *     summary: Crear un horario
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hora_inicio
 *             properties:
 *               hora_inicio:
 *                 type: string
 *                 example: "09:00:00"
 *               hora_fin:
 *                 type: string
 *                 example: "10:00:00"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Horario creado correctamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 */
router.post(
    '/',
    verificarToken,
    verificarAdministrador,
    crearHorario
);


/**
 * @swagger
 * /api/horarios/{id}:
 *   put:
 *     summary: Actualizar un horario
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hora_inicio
 *               - activo
 *             properties:
 *               hora_inicio:
 *                 type: string
 *                 example: "09:00:00"
 *               hora_fin:
 *                 type: string
 *                 example: "10:00:00"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Horario actualizado correctamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Horario no encontrado
 */
router.put(
    '/:id',
    verificarToken,
    verificarAdministrador,
    actualizarHorario
);


/**
 * @swagger
 * /api/horarios/{id}:
 *   delete:
 *     summary: Eliminar un horario
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario eliminado correctamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Horario no encontrado
 *       409:
 *         description: El horario tiene citas relacionadas
 */
router.delete(
    '/:id',
    verificarToken,
    verificarAdministrador,
    eliminarHorario
);

module.exports = router;