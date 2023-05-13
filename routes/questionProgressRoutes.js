const express = require('express');
const questionProgressController = require('../controllers/questionProgressController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(questionProgressController.getAllQuestionProgresss)
  .post(
    authController.restrictTo('admin'),
    questionProgressController.createQuestionProgress
  );

router
  .route('/:id')
  .get(questionProgressController.getQuestionProgress)
  .patch(
    authController.restrictTo('admin'),
    questionProgressController.updateQuestionProgress
  )
  .delete(
    authController.restrictTo('admin'),
    questionProgressController.deleteQuestionProgress
  );

module.exports = router;
