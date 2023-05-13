const express = require('express');
const answerController = require('../controllers/answerController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(answerController.getAllAnswers)
  .post(authController.restrictTo('admin'), answerController.createAnswer);

router
  .route('/:id')
  .get(answerController.getAnswer)
  .patch(authController.restrictTo('admin'), answerController.updateAnswer)
  .delete(authController.restrictTo('admin'), answerController.deleteAnswer);

module.exports = router;
