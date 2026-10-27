const express = require('express');

const {
    crearCita,
    obtenerMisCitas,
    obtenerTodasLasCitas,
    obtenerCitaPorId,
    actualizarCita,
    eliminarCita
} = require('../controllers/citas.controller');

const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Citas
 *   description: Gestión de citas de ORION SYSTEM
 */

/**
 * @swagger
 * /api/citas:
 *   post:
 *     summary: Registrar una nueva cita
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_servicio
 *               - id_horario
 *               - fecha
 *               - tipo_equipo
 *               - nombre_contacto
 *               - telefono
 *             properties:
 *               id_servicio:
 *                 type: integer
 *                 example: 1
 *               id_horario:
 *                 type: integer
 *                 example: 1
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-05"
 *               tipo_equipo:
 *                 type: string
 *                 example: Laptop
 *               modelo:
 *                 type: string
 *                 example: HP EliteBook 850 G5
 *               detalle_servicio:
 *                 type: string
 *                 example: Mantenimiento preventivo y limpieza interna
 *               nombre_contacto:
 *                 type: string
 *                 example: Jose Alberto Vidarte Mena
 *               telefono:
 *                 type: string
 *                 example: "953917816"
 *               email:
 *                 type: string
 *                 example: corporacionorionsystem@hotmail.com
 *     responses:
 *       201:
 *         description: Cita registrada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Servicio u horario no encontrado
 *       409:
 *         description: Horario ocupado
 */
router.post(
    '/',
    verificarToken,
    crearCita
);


/**
 * @swagger
 * /api/citas/mis-citas:
 *   get:
 *     summary: Obtener las citas del usuario autenticado
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de citas del usuario
 */
router.get(
    '/mis-citas',
    verificarToken,
    obtenerMisCitas
);


/**
 * @swagger
 * /api/citas:
 *   get:
 *     summary: Obtener todas las citas
 *     description: Endpoint exclusivo para administradores.
 *     tags: [Citas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de citas
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 */
router.get(
    '/',
    verificarToken,
    verificarAdministrador,
    obtenerTodasLasCitas
);


/**
 * @swagger
 * /api/citas/{id}:
 *   get:
 *     summary: Obtener una cita específica
 *     tags: [Citas]
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
 *         description: Cita encontrada
 *       404:
 *         description: Cita no encontrada
 */
router.get(
    '/:id',
    verificarToken,
    obtenerCitaPorId
);


/**
 * @swagger
 * /api/citas/{id}:
 *   put:
 *     summary: Actualizar una cita
 *     tags: [Citas]
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
 *               - id_servicio
 *               - id_horario
 *               - fecha
 *               - tipo_equipo
 *               - nombre_contacto
 *               - telefono
 *             properties:
 *               id_servicio:
 *                 type: integer
 *                 example: 1
 *               id_horario:
 *                 type: integer
 *                 example: 1
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-05"
 *               tipo_equipo:
 *                 type: string
 *                 example: Laptop
 *               modelo:
 *                 type: string
 *                 example: HP EliteBook 850 G5
 *               detalle_servicio:
 *                 type: string
 *                 example: Limpieza y mantenimiento
 *               nombre_contacto:
 *                 type: string
 *                 example: Jose Alberto Vidarte Mena
 *               telefono:
 *                 type: string
 *                 example: "953917816"
 *               email:
 *                 type: string
 *                 example: corporacionorionsystem@hotmail.com
 *               estado:
 *                 type: string
 *                 example: CONFIRMADA
 *               observaciones:
 *                 type: string
 *                 example: Cliente confirmó la cita
 *     responses:
 *       200:
 *         description: Cita actualizada correctamente
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Cita no encontrada
 *       409:
 *         description: Horario ocupado
 */
router.put(
    '/:id',
    verificarToken,
    actualizarCita
);


/**
 * @swagger
 * /api/citas/{id}:
 *   delete:
 *     summary: Cancelar una cita
 *     tags: [Citas]
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
 *         description: Cita cancelada correctamente
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Cita no encontrada
 */
router.delete(
    '/:id',
    verificarToken,
    eliminarCita
);


module.exports = router;