const express = require('express');

const {
    obtenerEspecificaciones,
    obtenerEspecificacionesPorProducto,
    obtenerEspecificacionPorId,
    crearEspecificacion,
    actualizarEspecificacion,
    eliminarEspecificacion
} = require('../controllers/productos-especificaciones.controller');

const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Productos Especificaciones
 *   description: Especificaciones técnicas de los productos
 */

/**
 * @swagger
 * /api/productos-especificaciones:
 *   get:
 *     summary: Obtener todas las especificaciones
 *     tags: [Productos Especificaciones]
 *     responses:
 *       200:
 *         description: Lista de especificaciones
 */
router.get('/', obtenerEspecificaciones);


/**
 * @swagger
 * /api/productos-especificaciones/producto/{id_producto}:
 *   get:
 *     summary: Obtener especificaciones de un producto
 *     tags: [Productos Especificaciones]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Especificaciones del producto
 */
router.get(
    '/producto/:id_producto',
    obtenerEspecificacionesPorProducto
);


/**
 * @swagger
 * /api/productos-especificaciones/{id}:
 *   get:
 *     summary: Obtener una especificación por ID
 *     tags: [Productos Especificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Especificación encontrada
 *       404:
 *         description: Especificación no encontrada
 */
router.get('/:id', obtenerEspecificacionPorId);


/**
 * @swagger
 * /api/productos-especificaciones:
 *   post:
 *     summary: Crear una especificación
 *     tags: [Productos Especificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_producto
 *               - nombre
 *               - valor
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Procesador
 *               valor:
 *                 type: string
 *                 example: Intel Core i7
 *               orden:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Especificación creada
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 */
router.post(
    '/',
    verificarToken,
    verificarAdministrador,
    crearEspecificacion
);


/**
 * @swagger
 * /api/productos-especificaciones/{id}:
 *   put:
 *     summary: Actualizar una especificación
 *     tags: [Productos Especificaciones]
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
 *               - id_producto
 *               - nombre
 *               - valor
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Memoria RAM
 *               valor:
 *                 type: string
 *                 example: 16 GB DDR4
 *               orden:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Especificación actualizada
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Especificación no encontrada
 */
router.put(
    '/:id',
    verificarToken,
    verificarAdministrador,
    actualizarEspecificacion
);


/**
 * @swagger
 * /api/productos-especificaciones/{id}:
 *   delete:
 *     summary: Eliminar una especificación
 *     tags: [Productos Especificaciones]
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
 *         description: Especificación eliminada
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Especificación no encontrada
 */
router.delete(
    '/:id',
    verificarToken,
    verificarAdministrador,
    eliminarEspecificacion
);


module.exports = router;