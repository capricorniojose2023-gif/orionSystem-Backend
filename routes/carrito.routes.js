const express = require('express');

const {
    obtenerCarrito,
    agregarProducto,
    actualizarCantidad,
    eliminarProducto,
    vaciarCarrito
} = require('../controllers/carrito.controller');

const {
    verificarToken
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Carrito
 *   description: Gestión del carrito de compras
 */

/**
 * @swagger
 * /api/carrito:
 *   get:
 *     summary: Obtener el carrito del usuario autenticado
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito obtenido correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
    '/',
    verificarToken,
    obtenerCarrito
);


/**
 * @swagger
 * /api/carrito/agregar:
 *   post:
 *     summary: Agregar un producto al carrito
 *     tags: [Carrito]
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
 *               - cantidad
 *             properties:
 *               id_producto:
 *                 type: integer
 *                 example: 1
 *               cantidad:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Producto agregado correctamente
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Producto no encontrado
 */
router.post(
    '/agregar',
    verificarToken,
    agregarProducto
);


/**
 * @swagger
 * /api/carrito/detalle/{id}:
 *   put:
 *     summary: Actualizar cantidad de un producto del carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del detalle del carrito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cantidad actualizada correctamente
 *       400:
 *         description: Cantidad inválida o stock insuficiente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Detalle no encontrado
 */
router.put(
    '/detalle/:id',
    verificarToken,
    actualizarCantidad
);


/**
 * @swagger
 * /api/carrito/detalle/{id}:
 *   delete:
 *     summary: Eliminar un producto del carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del detalle del carrito
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Producto del carrito no encontrado
 */
router.delete(
    '/detalle/:id',
    verificarToken,
    eliminarProducto
);


/**
 * @swagger
 * /api/carrito/vaciar:
 *   delete:
 *     summary: Vaciar el carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vaciado correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.delete(
    '/vaciar',
    verificarToken,
    vaciarCarrito
);


module.exports = router;