const express = require('express');

const {
    crearPago,
    obtenerMisPagos,
    obtenerPagoPorId
} = require('../controllers/pagos.controller');

const {
    verificarToken
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: Gestión de pagos de los pedidos
 */

/**
 * @swagger
 * /api/pagos:
 *   get:
 *     summary: Obtener los pagos del usuario autenticado
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pagos
 *       401:
 *         description: Token requerido o inválido
 */
router.get('/', verificarToken, obtenerMisPagos);


/**
 * @swagger
 * /api/pagos:
 *   post:
 *     summary: Registrar un pago para un pedido
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_pedido
 *               - metodo_pago
 *             properties:
 *               id_pedido:
 *                 type: integer
 *                 example: 1
 *               metodo_pago:
 *                 type: string
 *                 example: YAPE
 *               referencia:
 *                 type: string
 *                 example: YAPE-ORION-001
 *               fecha_pago:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-09-28T11:30:00
 *     responses:
 *       201:
 *         description: Pago registrado correctamente
 *       400:
 *         description: Datos obligatorios faltantes
 *       404:
 *         description: Pedido no encontrado
 *       409:
 *         description: El pedido ya tiene un pago
 *       401:
 *         description: Token requerido o inválido
 */
router.post('/', verificarToken, crearPago);


/**
 * @swagger
 * /api/pagos/{id}:
 *   get:
 *     summary: Obtener un pago específico del usuario autenticado
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago
 *     responses:
 *       200:
 *         description: Pago encontrado
 *       404:
 *         description: Pago no encontrado
 *       401:
 *         description: Token requerido o inválido
 */
router.get('/:id', verificarToken, obtenerPagoPorId);


module.exports = router;