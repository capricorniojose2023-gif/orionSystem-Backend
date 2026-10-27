const { sql, poolPromise } = require('../config/database');

// =====================================================
// GET - OBTENER TODOS LOS PRODUCTOS
// =====================================================
const obtenerProductos = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .query(`
                SELECT
                    p.id_producto,
                    p.id_categoria,
                    c.nombre AS categoria,
                    p.nombre,
                    p.descripcion,
                    p.precio,
                    p.stock,
                    p.imagen,
                    p.marca,
                    p.modelo,
                    p.activo,
                    p.fecha_registro,
                    p.fecha_actualizacion
                FROM productos p
                INNER JOIN categorias c
                    ON p.id_categoria = c.id_categoria
                ORDER BY p.id_producto DESC
            `);

        res.json({
            ok: true,
            cantidad: resultado.recordset.length,
            datos: resultado.recordset
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener los productos',
            error: error.message
        });
    }
};


// =====================================================
// GET - OBTENER PRODUCTO POR ID
// =====================================================
const obtenerProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    p.id_producto,
                    p.id_categoria,
                    c.nombre AS categoria,
                    p.nombre,
                    p.descripcion,
                    p.precio,
                    p.stock,
                    p.imagen,
                    p.marca,
                    p.modelo,
                    p.activo,
                    p.fecha_registro,
                    p.fecha_actualizacion
                FROM productos p
                INNER JOIN categorias c
                    ON p.id_categoria = c.id_categoria
                WHERE p.id_producto = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            ok: true,
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener producto:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener el producto',
            error: error.message
        });
    }
};


// =====================================================
// POST - CREAR PRODUCTO
// =====================================================
const crearProducto = async (req, res) => {
    try {
        const {
            id_categoria,
            nombre,
            descripcion,
            precio,
            stock,
            imagen,
            marca,
            modelo
        } = req.body;

        // VALIDACIONES
        if (
            id_categoria === undefined ||
            !nombre ||
            precio === undefined
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'id_categoria, nombre y precio son obligatorios'
            });
        }

        const pool = await poolPromise;

        // Verificar que la categoría exista
        const categoria = await pool.request()
            .input('id_categoria', sql.Int, id_categoria)
            .query(`
                SELECT id_categoria
                FROM categorias
                WHERE id_categoria = @id_categoria
            `);

        if (categoria.recordset.length === 0) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La categoría indicada no existe'
            });
        }

        const resultado = await pool.request()
            .input('id_categoria', sql.Int, id_categoria)
            .input('nombre', sql.NVarChar(150), nombre)
            .input('descripcion', sql.NVarChar(500), descripcion || null)
            .input('precio', sql.Decimal(10, 2), precio)
            .input('stock', sql.Int, stock ?? 0)
            .input('imagen', sql.VarChar(500), imagen || null)
            .input('marca', sql.VarChar(80), marca || null)
            .input('modelo', sql.VarChar(100), modelo || null)
            .query(`
                INSERT INTO productos
                (
                    id_categoria,
                    nombre,
                    descripcion,
                    precio,
                    stock,
                    imagen,
                    marca,
                    modelo
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @id_categoria,
                    @nombre,
                    @descripcion,
                    @precio,
                    @stock,
                    @imagen,
                    @marca,
                    @modelo
                )
            `);

        res.status(201).json({
            ok: true,
            mensaje: 'Producto creado correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear producto:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear el producto',
            error: error.message
        });
    }
};


// =====================================================
// PUT - ACTUALIZAR PRODUCTO
// =====================================================
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            id_categoria,
            nombre,
            descripcion,
            precio,
            stock,
            imagen,
            marca,
            modelo,
            activo
        } = req.body;

        if (
            id_categoria === undefined ||
            !nombre ||
            precio === undefined
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: 'id_categoria, nombre y precio son obligatorios'
            });
        }

        const pool = await poolPromise;

        // Verificar categoría
        const categoria = await pool.request()
            .input('id_categoria', sql.Int, id_categoria)
            .query(`
                SELECT id_categoria
                FROM categorias
                WHERE id_categoria = @id_categoria
            `);

        if (categoria.recordset.length === 0) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La categoría indicada no existe'
            });
        }

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('id_categoria', sql.Int, id_categoria)
            .input('nombre', sql.NVarChar(150), nombre)
            .input('descripcion', sql.NVarChar(500), descripcion || null)
            .input('precio', sql.Decimal(10, 2), precio)
            .input('stock', sql.Int, stock ?? 0)
            .input('imagen', sql.VarChar(500), imagen || null)
            .input('marca', sql.VarChar(80), marca || null)
            .input('modelo', sql.VarChar(100), modelo || null)
            .input('activo', sql.Bit, activo ?? true)
            .query(`
                UPDATE productos
                SET
                    id_categoria = @id_categoria,
                    nombre = @nombre,
                    descripcion = @descripcion,
                    precio = @precio,
                    stock = @stock,
                    imagen = @imagen,
                    marca = @marca,
                    modelo = @modelo,
                    activo = @activo,
                    fecha_actualizacion = SYSDATETIME()
                OUTPUT INSERTED.*
                WHERE id_producto = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Producto actualizado correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar el producto',
            error: error.message
        });
    }
};


// =====================================================
// DELETE - ELIMINAR PRODUCTO
// =====================================================
const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM productos
                OUTPUT DELETED.*
                WHERE id_producto = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Producto eliminado correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al eliminar producto:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al eliminar el producto',
            error: error.message
        });
    }
};


// =====================================================
// EXPORTAR FUNCIONES
// =====================================================
module.exports = {
    obtenerProductos,
    obtenerProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};