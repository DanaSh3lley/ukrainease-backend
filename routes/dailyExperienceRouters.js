const express = require('express');
const dailyExperienceController = require('../controllers/dailyExperienceController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/user')
  .get(dailyExperienceController.getUserDailyExperienceHistory);

router
  .route('/')
  .get(dailyExperienceController.getAllDailyExperiences)
  .post(
    authController.restrictTo('admin'),
    dailyExperienceController.createDailyExperience
  );

router
  .route('/:id')
  .get(dailyExperienceController.getDailyExperience)
  .patch(
    authController.restrictTo('admin'),
    dailyExperienceController.updateDailyExperience
  )
  .delete(
    authController.restrictTo('admin'),
    dailyExperienceController.deleteDailyExperience
  );

module.exports = router;
