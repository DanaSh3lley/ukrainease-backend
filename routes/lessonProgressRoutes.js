const express = require('express');
const lessonProgressController = require('../controllers/lessonProgressController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(lessonProgressController.getAllLessonProgresss)
  .post(
    authController.restrictTo('admin'),
    lessonProgressController.createLessonProgress
  );

router
  .route('/:id')
  .get(lessonProgressController.getLessonProgress)
  .patch(
    authController.restrictTo('admin'),
    lessonProgressController.updateLessonProgress
  )
  .delete(
    authController.restrictTo('admin'),
    lessonProgressController.deleteLessonProgress
  );

module.exports = router;
