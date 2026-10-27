const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4 // <--- Añade esto aquí para forzar IPv4 en Render
});

pool.on('connect', () => {
  console.log('Base de datos conectada exitosamente a Supabase (PostgreSQL)');
});

module.exports = {
  pool,
  poolPromise: Promise.resolve(pool)
};