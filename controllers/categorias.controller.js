const { sql, poolPromise } = require('../config/database');

// =====================================================
// GET - OBTENER TODAS LAS CATEGORÍAS
// =====================================================
const obtenerCategorias = async (req, res) => {
    try {
        const pool = await poolPromise;

        const resultado = await pool.request()
            .query(`
                SELECT
                    id_categoria,
                    nombre,
                    descripcion,
                    activo
                FROM categorias
                ORDER BY id_categoria ASC
            `);

        res.json({
            ok: true,
            cantidad: resultado.recordset.length,
            datos: resultado.recordset
        });

    } catch (error) {
        console.error('Error al obtener categorías:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener las categorías',
            error: error.message
        });
    }
};


// =====================================================
// GET - OBTENER CATEGORÍA POR ID
// =====================================================
const obtenerCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    id_categoria,
                    nombre,
                    descripcion,
                    activo
                FROM categorias
                WHERE id_categoria = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener categoría:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener la categoría',
            error: error.message
        });
    }
};


// =====================================================
// POST - CREAR CATEGORÍA
// =====================================================
const crearCategoria = async (req, res) => {
    try {
        const {
            id_categoria,
            nombre,
            descripcion,
            activo
        } = req.body;

        if (id_categoria === undefined || !nombre) {
            return res.status(400).json({
                ok: false,
                mensaje: 'id_categoria y nombre son obligatorios'
            });
        }

        const pool = await poolPromise;

        // Verificar que no exista el ID
        const existe = await pool.request()
            .input('id_categoria', sql.Int, id_categoria)
            .query(`
                SELECT id_categoria
                FROM categorias
                WHERE id_categoria = @id_categoria
            `);

        if (existe.recordset.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe una categoría con ese ID'
            });
        }

        const resultado = await pool.request()
            .input('id_categoria', sql.Int, id_categoria)
            .input('nombre', sql.VarChar(50), nombre)
            .input('descripcion', sql.VarChar(200), descripcion || null)
            .input('activo', sql.Bit, activo ?? true)
            .query(`
                INSERT INTO categorias
                (
                    id_categoria,
                    nombre,
                    descripcion,
                    activo
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @id_categoria,
                    @nombre,
                    @descripcion,
                    @activo
                )
            `);

        res.status(201).json({
            ok: true,
            mensaje: 'Categoría creada correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear categoría:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear la categoría',
            error: error.message
        });
    }
};


// =====================================================
// PUT - ACTUALIZAR CATEGORÍA
// =====================================================
const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombre,
            descripcion,
            activo
        } = req.body;

        if (!nombre) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre es obligatorio'
            });
        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar(50), nombre)
            .input('descripcion', sql.VarChar(200), descripcion || null)
            .input('activo', sql.Bit, activo ?? true)
            .query(`
                UPDATE categorias
                SET
                    nombre = @nombre,
                    descripcion = @descripcion,
                    activo = @activo
                OUTPUT INSERTED.*
                WHERE id_categoria = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Categoría actualizada correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar categoría:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar la categoría',
            error: error.message
        });
    }
};


// =====================================================
// DELETE - ELIMINAR CATEGORÍA
// =====================================================
const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM categorias
                OUTPUT DELETED.*
                WHERE id_categoria = @id
            `);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Categoría eliminada correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {
        console.error('Error al eliminar categoría:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'No se puede eliminar la categoría. Puede estar siendo utilizada por productos.',
            error: error.message
        });
    }
};


// =====================================================
// EXPORTAR
// =====================================================
module.exports = {
    obtenerCategorias,
    obtenerCategoria,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
};