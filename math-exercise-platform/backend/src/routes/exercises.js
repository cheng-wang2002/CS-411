// backend/src/routes/exercises.js
const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');

// 路由保持不变，因为我们通过查询参数处理分页
router.get('/', exerciseController.getAllExercises);
router.get('/search', exerciseController.searchExercises);
router.get('/:id', exerciseController.getExerciseById);

// Stars路由（替换原有的starred）
router.get('/stars/list', exerciseController.getStarredExercises);
router.post('/stars/:id', exerciseController.starExercise);
router.delete('/stars/:id', exerciseController.unstarExercise);
router.get('/stars/check/:id', exerciseController.checkIsStarred);


// explore-history
router.get('/explore-history/list', exerciseController.getExploreHistory);
router.post('/explore-history/:id', exerciseController.addToExploreHistory);

module.exports = router;
