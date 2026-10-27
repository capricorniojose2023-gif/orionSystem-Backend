const { sql, poolPromise } = require('../config/database');


// ========================================
// OBTENER TODAS LAS LICENCIAS
// GET /api/licencias
// ========================================

const obtenerLicencias = async (req, res) => {

    try {

        const pool = await poolPromise;

        const resultado = await pool.request()
            .query(`
                SELECT
                    id_licencia,
                    nombre,
                    software,
                    descripcion,
                    precio,
                    duracion_meses,
                    stock,
                    activo,
                    fecha_registro
                FROM licencias
                ORDER BY id_licencia DESC
            `);

        res.json({
            ok: true,
            cantidad: resultado.recordset.length,
            datos: resultado.recordset
        });

    } catch (error) {

        console.error('Error al obtener licencias:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener las licencias',
            error: error.message
        });

    }

};


// ========================================
// OBTENER UNA LICENCIA POR ID
// GET /api/licencias/:id
// ========================================

const obtenerLicencia = async (req, res) => {

    try {

        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    id_licencia,
                    nombre,
                    software,
                    descripcion,
                    precio,
                    duracion_meses,
                    stock,
                    activo,
                    fecha_registro
                FROM licencias
                WHERE id_licencia = @id
            `);

        if (resultado.recordset.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Licencia no encontrada'
            });

        }

        res.json({
            ok: true,
            datos: resultado.recordset[0]
        });

    } catch (error) {

        console.error('Error al obtener licencia:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener la licencia',
            error: error.message
        });

    }

};


// ========================================
// CREAR LICENCIA
// POST /api/licencias
// ========================================

const crearLicencia = async (req, res) => {

    try {

        const {
            nombre,
            software,
            descripcion,
            precio,
            duracion_meses,
            stock
        } = req.body;

        if (!nombre || !software || precio === undefined) {

            return res.status(400).json({
                ok: false,
                mensaje: 'nombre, software y precio son obligatorios'
            });

        }

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('nombre', sql.NVarChar(150), nombre)
            .input('software', sql.VarChar(100), software)
            .input('descripcion', sql.NVarChar(500), descripcion || null)
            .input('precio', sql.Decimal(10, 2), precio)
            .input('duracion_meses', sql.Int, duracion_meses || null)
            .input('stock', sql.Int, stock ?? 0)
            .query(`
                INSERT INTO licencias
                (
                    nombre,
                    software,
                    descripcion,
                    precio,
                    duracion_meses,
                    stock
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @nombre,
                    @software,
                    @descripcion,
                    @precio,
                    @duracion_meses,
                    @stock
                )
            `);

        res.status(201).json({
            ok: true,
            mensaje: 'Licencia creada correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {

        console.error('Error al crear licencia:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear la licencia',
            error: error.message
        });

    }

};


// ========================================
// ACTUALIZAR LICENCIA
// PUT /api/licencias/:id
// ========================================

const actualizarLicencia = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nombre,
            software,
            descripcion,
            precio,
            duracion_meses,
            stock,
            activo
        } = req.body;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.NVarChar(150), nombre)
            .input('software', sql.VarChar(100), software)
            .input('descripcion', sql.NVarChar(500), descripcion || null)
            .input('precio', sql.Decimal(10, 2), precio)
            .input('duracion_meses', sql.Int, duracion_meses || null)
            .input('stock', sql.Int, stock ?? 0)
            .input('activo', sql.Bit, activo ?? true)
            .query(`
                UPDATE licencias
                SET
                    nombre = @nombre,
                    software = @software,
                    descripcion = @descripcion,
                    precio = @precio,
                    duracion_meses = @duracion_meses,
                    stock = @stock,
                    activo = @activo
                OUTPUT INSERTED.*
                WHERE id_licencia = @id
            `);

        if (resultado.recordset.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Licencia no encontrada'
            });

        }

        res.json({
            ok: true,
            mensaje: 'Licencia actualizada correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {

        console.error('Error al actualizar licencia:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar la licencia',
            error: error.message
        });

    }

};


// ========================================
// ELIMINAR LICENCIA
// DELETE /api/licencias/:id
// ========================================

const eliminarLicencia = async (req, res) => {

    try {

        const { id } = req.params;

        const pool = await poolPromise;

        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM licencias
                OUTPUT DELETED.*
                WHERE id_licencia = @id
            `);

        if (resultado.recordset.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Licencia no encontrada'
            });

        }

        res.json({
            ok: true,
            mensaje: 'Licencia eliminada correctamente',
            datos: resultado.recordset[0]
        });

    } catch (error) {

        console.error('Error al eliminar licencia:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al eliminar la licencia',
            error: error.message
        });

    }

};


module.exports = {
    obtenerLicencias,
    obtenerLicencia,
    crearLicencia,
    actualizarLicencia,
    eliminarLicencia
};