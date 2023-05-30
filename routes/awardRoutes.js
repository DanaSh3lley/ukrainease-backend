const express = require('express');
const awardController = require('../controllers/awardController');
const authController = require('../controllers/authController');
const {
  getAwardsWithCompletionStatus,
} = require('../controllers/awardController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(awardController.getAllAwards)
  .post(authController.restrictTo('admin'), awardController.createAward);

router
  .route('/:id')
  .get(awardController.getAward)
  .patch(authController.restrictTo('admin'), awardController.updateAward)
  .delete(authController.restrictTo('admin'), awardController.deleteAward);

router.get('/status', getAwardsWithCompletionStatus);

module.exports = router;
