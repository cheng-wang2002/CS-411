const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'WteamW2024', // 如果您的MySQL没有密码，就留空
  database: 'education',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 添加测试连接代码
pool.query('SELECT 1')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));

app.use(cors());

const PORT = process.env.PORT || 8080;
// Simple API route
app.get('/api/exercises', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        console.log(page, limit)
        const offset = (page - 1) * limit;
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM Exercise');
        const total = countResult[0].total;
        
        // 带分页的查询
        const [exercises] = await pool.query(
            'SELECT * FROM Exercise LIMIT ? OFFSET ?',
            [limit, offset]
        );
        console.log(exercises.length)
        return res.json({
            data: exercises,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch(err) {
        console.error('Database error:', err);
        res.status(500).json({ message: err.message });
    }
    
});

app.get('/api/exercises/searchExercises', async (req, res) => {
  try {
    const { category, difficulty, keyword, page, limit} = req.query;
    console.log([category, difficulty, keyword, page, limit])
    // const page = parseInt(rpage) || 1;
    // const limit = parseInt(rlimit) || 6;
    // console.log(page)
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = 'SELECT * FROM Exercise WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM Exercise WHERE 1=1';
    const params = [];
    const countParams = [];

    if (category) {
      query += ' AND Category = ?';
      countQuery += ' AND Category = ?';
      params.push(category);
      countParams.push(category);
    }
    if (difficulty) {
      query += ' AND DifficultyLevel = ?';
      countQuery += ' AND DifficultyLevel = ?';
      params.push(difficulty);
      countParams.push(difficulty);
    }
    if (keyword) {
      query += ' AND (QuestionContent LIKE ? OR Category LIKE ?)';
      countQuery += ' AND (QuestionContent LIKE ? OR Category LIKE ?)';
      params.push(`%${keyword}%`, `%s${keyword}%`);
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 添加分页
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // 执行查询
    const [exercises] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return res.json({
      data: exercises,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
})
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});