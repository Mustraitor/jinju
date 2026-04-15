import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  // 关键修改：优先读取环境变量 DB_HOST，如果没有则回退到 127.0.0.1
  // 在 Docker 运行时，这个值会被设置为 'db'
  host: process.env.DB_HOST || '127.0.0.1', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'jinju_project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;