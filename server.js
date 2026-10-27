const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

// Importamos el pool de PostgreSQL en lugar de poolPromise de SQL Server
const { Pool } = require('pg');

const licenciasRoutes = require('./routes/licencias.routes');
const productosRoutes = require('./routes/productos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const rolesRoutes = require('./routes/roles.routes');
const authRoutes = require('./routes/auth.routes');
const carritoRoutes = require('./routes/carrito.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const pagosRoutes = require('./routes/pagos.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const horariosRoutes = require('./routes/horarios.routes');
const citasRoutes = require('./routes/citas.routes');
const productosEspecificacionesRoutes = require('./routes/productos-especificaciones.routes');

const app = express();

const PORT = process.env.PORT || 3000;

// Configurar la conexión a PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ========================================
// MIDDLEWARES
// ========================================

app.use(cors());
app.use(express.json());

// ========================================
// SWAGGER
// ========================================

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// ========================================
// RUTAS DE LA API
// ========================================

app.use('/api/licencias', licenciasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/productos-especificaciones', productosEspecificacionesRoutes);

// ========================================
// RUTA PRINCIPAL
// ========================================

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API ORION SYSTEM funcionando correctamente',
        estado: 'OK'
    });
});

// ========================================
// PRUEBA DE BASE DE DATOS (SUPABASE)
// ========================================

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time, current_database() as base_datos');

        res.json({
            mensaje: 'Conexión a Supabase (PostgreSQL) correcta',
            baseDatos: result.rows[0].base_datos,
            tiempoActual: result.rows[0].current_time
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al consultar Supabase',
            error: error.message
        });
    }
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
    console.log(
        `🚀 Servidor ORION SYSTEM ejecutándose en http://localhost:${PORT}`
    );
});