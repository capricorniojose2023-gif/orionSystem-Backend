const express = require('express');

const {
    obtenerRoles,
    obtenerRol,
    crearRol,
    actualizarRol,
    eliminarRol
} = require('../controllers/roles.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestión de roles de ORION SYSTEM
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtener todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles
 */
router.get('/', obtenerRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener un rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol encontrado
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id', obtenerRol);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear un nuevo rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_rol
 *               - nombre
 *             properties:
 *               id_rol:
 *                 type: integer
 *                 example: 3
 *               nombre:
 *                 type: string
 *                 example: TECNICO
 *               descripcion:
 *                 type: string
 *                 example: Técnico de soporte de ORION SYSTEM
 *     responses:
 *       201:
 *         description: Rol creado correctamente
 *       400:
 *         description: Datos obligatorios faltantes
 *       409:
 *         description: El rol ya existe
 */
router.post('/', crearRol);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar un rol existente
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: TECNICO
 *               descripcion:
 *                 type: string
 *                 example: Técnico de soporte de ORION SYSTEM
 *     responses:
 *       200:
 *         description: Rol actualizado correctamente
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: Ya existe otro rol con ese nombre
 */
router.put('/:id', actualizarRol);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar un rol
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol eliminado correctamente
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene usuarios asociados
 */
router.delete('/:id', eliminarRol);

module.exports = router;

