const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Base de datos conectada exitosamente a Supabase (PostgreSQL)');
});

module.exports = {
  pool,
  // Por si algún controlador antiguo usa poolPromise, lo adaptamos para que no falle:
  poolPromise: Promise.resolve(pool)
};