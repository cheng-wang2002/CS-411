// backend/src/server.js
const express = require('express');
const cors = require('cors');
const exerciseRoutes = require('./routes/exercises');

const app = express();
const PORT = process.env.PORT || 5001;

// 添加更详细的CORS配置
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use('/api/exercises', exerciseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});