// backend/src/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'crc', // 如果您的MySQL没有密码，就留空
  database: 'math_exercise_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 添加测试连接代码
pool.query('SELECT 1')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));

module.exports = pool;