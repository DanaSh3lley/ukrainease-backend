const express = require('express');
const lessonController = require('../controllers/lessonController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(lessonController.getAllLessons)
  .post(authController.restrictTo('admin'), lessonController.createLesson);

router
  .route('/:id')
  .get(lessonController.getLesson)
  .patch(authController.restrictTo('admin'), lessonController.updateLesson)
  .delete(authController.restrictTo('admin'), lessonController.deleteLesson);

module.exports = router;
