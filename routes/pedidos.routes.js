const express = require('express');

const {
    crearPedido,
    obtenerMisPedidos,
    obtenerPedidoPorId
} = require('../controllers/pedidos.controller');

const {
    verificarToken
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pedidos
 *   description: Gestión de pedidos de los usuarios
 */

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener los pedidos del usuario autenticado
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get(
    '/',
    verificarToken,
    obtenerMisPedidos
);


/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Crear un pedido a partir del carrito
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               costo_envio:
 *                 type: number
 *                 format: decimal
 *                 example: 0
 *               impuestos:
 *                 type: number
 *                 format: decimal
 *                 example: 0
 *               direccion_envio:
 *                 type: string
 *                 example: Av. Jorge Chávez 1104, Chiclayo
 *               observaciones:
 *                 type: string
 *                 example: Entregar en horario de oficina
 *     responses:
 *       201:
 *         description: Pedido creado correctamente
 *       400:
 *         description: Carrito vacío, stock insuficiente o datos inválidos
 *       401:
 *         description: Token inválido o no proporcionado
 *       500:
 *         description: Error interno del servidor
 */
router.post(
    '/',
    verificarToken,
    crearPedido
);


/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtener un pedido específico del usuario autenticado
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Pedido obtenido correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Pedido no encontrado
 */
router.get(
    '/:id',
    verificarToken,
    obtenerPedidoPorId
);


module.exports = router;

