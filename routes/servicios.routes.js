const express = require('express');

const {
    obtenerServicios,
    obtenerServicioPorId,
    crearServicio,
    actualizarServicio,
    eliminarServicio
} = require('../controllers/servicios.controller');

const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Servicios
 *   description: Gestión de servicios técnicos de ORION SYSTEM
 */

/**
 * @swagger
 * /api/servicios:
 *   get:
 *     summary: Obtener todos los servicios
 *     tags: [Servicios]
 *     responses:
 *       200:
 *         description: Lista de servicios
 */
router.get('/', obtenerServicios);


/**
 * @swagger
 * /api/servicios/{id}:
 *   get:
 *     summary: Obtener un servicio por ID
 *     tags: [Servicios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Servicio encontrado
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id', obtenerServicioPorId);


/**
 * @swagger
 * /api/servicios:
 *   post:
 *     summary: Crear un servicio
 *     tags: [Servicios]
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
 *               - categoria
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Mantenimiento de Laptop
 *               categoria:
 *                 type: string
 *                 example: LAPTOPS
 *               descripcion:
 *                 type: string
 *                 example: Limpieza y mantenimiento preventivo de laptop
 *               precio_desde:
 *                 type: number
 *                 example: 90.00
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Servicio creado correctamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 */
router.post(
    '/',
    verificarToken,
    verificarAdministrador,
    crearServicio
);


/**
 * @swagger
 * /api/servicios/{id}:
 *   put:
 *     summary: Actualizar un servicio
 *     tags: [Servicios]
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
 *               - nombre
 *               - categoria
 *               - activo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Mantenimiento de Laptop
 *               categoria:
 *                 type: string
 *                 example: LAPTOPS
 *               descripcion:
 *                 type: string
 *                 example: Limpieza interna y mantenimiento preventivo
 *               precio_desde:
 *                 type: number
 *                 example: 90.00
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Servicio actualizado correctamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Servicio no encontrado
 */
router.put(
    '/:id',
    verificarToken,
    verificarAdministrador,
    actualizarServicio
);


/**
 * @swagger
 * /api/servicios/{id}:
 *   delete:
 *     summary: Eliminar un servicio
 *     tags: [Servicios]
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
 *         description: Servicio eliminado correctamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Servicio no encontrado
 */
router.delete(
    '/:id',
    verificarToken,
    verificarAdministrador,
    eliminarServicio
);


module.exports = router;