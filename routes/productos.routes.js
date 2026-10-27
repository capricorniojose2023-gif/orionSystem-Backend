const express = require('express');

const {
    verificarToken,
    verificarAdministrador
} = require('../middlewares/auth.middleware');

const {
    obtenerProductos,
    obtenerProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/productos.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de productos de ORION SYSTEM
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos obtenida correctamente
 *       500:
 *         description: Error del servidor
 */
router.get('/', obtenerProductos);


/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', obtenerProducto);


/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_categoria
 *               - nombre
 *               - precio
 *             properties:
 *               id_categoria:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Lenovo Yoga
 *               descripcion:
 *                 type: string
 *                 example: Laptop Lenovo con Intel Core i5
 *               precio:
 *                 type: number
 *                 example: 1699.00
 *               stock:
 *                 type: integer
 *                 example: 5
 *               imagen:
 *                 type: string
 *                 example: lenovo-yoga.jpg
 *               marca:
 *                 type: string
 *                 example: Lenovo
 *               modelo:
 *                 type: string
 *                 example: Yoga
 *     responses:
 *       201:
 *         description: Producto creado correctamente
 *       400:
 *         description: Datos incorrectos
 *       500:
 *         description: Error del servidor
 */
router.post(
    '/',
    verificarToken,
    verificarAdministrador,
    crearProducto
);


/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_categoria
 *               - nombre
 *               - precio
 *             properties:
 *               id_categoria:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Lenovo Yoga actualizado
 *               descripcion:
 *                 type: string
 *                 example: Laptop actualizada
 *               precio:
 *                 type: number
 *                 example: 1799.00
 *               stock:
 *                 type: integer
 *                 example: 8
 *               imagen:
 *                 type: string
 *                 example: lenovo-yoga.jpg
 *               marca:
 *                 type: string
 *                 example: Lenovo
 *               modelo:
 *                 type: string
 *                 example: Yoga
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *       400:
 *         description: Datos incorrectos
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put(
    '/:id',
    verificarToken,
    verificarAdministrador,
    actualizarProducto
);


/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete(
    '/:id',
    verificarToken,
    verificarAdministrador,
    eliminarProducto
);


module.exports = router;