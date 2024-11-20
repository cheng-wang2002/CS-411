const pool = require('../config/db');

const exerciseController = {
  getAllExercises: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const offset = (page - 1) * limit;
      
      const [countResult] = await pool.query('SELECT COUNT(*) as total FROM Exercise');
      const total = countResult[0].total;
      
      const [exercises] = await pool.query(
        'SELECT * FROM Exercise LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      res.json({
        data: exercises,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  searchExercises: async (req, res) => {
    try {
      const { category, difficulty, keyword, page = 1, limit = 6 } = req.query;
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
        params.push(`%${keyword}%`, `%${keyword}%`);
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [exercises] = await pool.query(query, params);
      const [countResult] = await pool.query(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        data: exercises,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getExerciseById: async (req, res) => {
    try {
      const [exercise] = await pool.query(
        'SELECT * FROM Exercise WHERE ExerciseID = ?',
        [req.params.id]
      );
      if (exercise.length === 0) {
        return res.status(404).json({ message: 'Exercise not found' });
      }
      res.json(exercise[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Stars 相关方法
  getStarredExercises: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : 1;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const offset = (page - 1) * limit;

      const [exercises] = await pool.query(
        `SELECT e.*, s.StarTime 
         FROM Exercise e 
         INNER JOIN Stars s ON e.ExerciseID = s.ExerciseID 
         WHERE s.UserID = ? 
         ORDER BY s.StarTime DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM Stars WHERE UserID = ?',
        [userId]
      );

      res.json({
        data: exercises,
        total: countResult[0].total,
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit)
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  starExercise: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : 1;
      const exerciseId = req.params.id;

      await pool.query(
        'INSERT INTO Stars (UserID, ExerciseID) VALUES (?, ?)',
        [userId, exerciseId]
      );

      await pool.query(
        'UPDATE User SET StarsCount = StarsCount + 1 WHERE UserID = ?',
        [userId]
      );

      res.json({ message: 'Exercise starred successfully' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Exercise already starred' });
      }
      res.status(500).json({ message: error.message });
    }
  },

  unstarExercise: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : 1;
      const exerciseId = req.params.id;

      await pool.query(
        'DELETE FROM Stars WHERE UserID = ? AND ExerciseID = ?',
        [userId, exerciseId]
      );

      await pool.query(
        'UPDATE User SET StarsCount = GREATEST(0, StarsCount - 1) WHERE UserID = ?',
        [userId]
      );

      res.json({ message: 'Exercise unstarred successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  checkIsStarred: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : 1;
      const exerciseId = req.params.id;

      const [result] = await pool.query(
        'SELECT 1 FROM Stars WHERE UserID = ? AND ExerciseID = ?',
        [userId, exerciseId]
      );

      res.json({ isStarred: result.length > 0 });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ExploreHistory 相关方法
  getExploreHistory: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : 1;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const offset = (page - 1) * limit;

      const [exercises] = await pool.query(
        `SELECT e.*, h.ExploreTime, h.SearchContent 
         FROM Exercise e 
         INNER JOIN ExploreHistory h ON e.ExerciseID = h.ExerciseID 
         WHERE h.UserID = ? 
         ORDER BY h.ExploreTime DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM ExploreHistory WHERE UserID = ?',
        [userId]
      );

      res.json({
        data: exercises,
        total: countResult[0].total,
        currentPage: page,
        totalPages: Math.ceil(countResult[0].total / limit)
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  addToExploreHistory: async (req, res) => {
    try {
      const userId = req.user ? req.user.id : 1;
      const exerciseId = req.params.id;
      const { searchContent } = req.body;

      await pool.query(
        'INSERT INTO ExploreHistory (UserID, ExerciseID, SearchContent) VALUES (?, ?, ?)',
        [userId, exerciseId, searchContent || '']
      );

      res.json({ message: 'Added to explore history successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = exerciseController;