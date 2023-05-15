const express = require('express');
const lessonController = require('../controllers/lessonController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(lessonController.getAllLessons)
  .post(authController.restrictTo('admin'), lessonController.createLesson);

router.get('/current-user', lessonController.getLessonsForUser);
router.get('/current-user/:lessonId', lessonController.getLessonByIdForUser);

router.post('/:lessonId/start', lessonController.startLesson);
router.post('/:lessonId/take', lessonController.takeLesson);
router.post('/:lessonId/finish', lessonController.finishLesson);

router.post('/submit-question', lessonController.submitQuestion);

router
  .route('/:id')
  .get(lessonController.getLesson)
  .patch(authController.restrictTo('admin'), lessonController.updateLesson)
  .delete(authController.restrictTo('admin'), lessonController.deleteLesson);

module.exports = router;
