const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'videoapi',
  password: process.env.DB_PASSWORD || 'passwordkuat123',
  database: process.env.DB_NAME     || 'videodb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Test koneksi saat startup
pool.getConnection()
  .then(conn => {
    console.log('✅  Database MySQL terhubung.');
    conn.release();
  })
  .catch(err => {
    console.error('❌  Gagal koneksi database:', err.message);
    process.exit(1);
  });

module.exports = pool;
