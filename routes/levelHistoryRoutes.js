const express = require('express');
const levelHistoryController = require('../controllers/levelHistoryController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/user').get(levelHistoryController.getUserLevelHistory);

router
  .route('/')
  .get(levelHistoryController.getAllLevelHistorys)
  .post(
    authController.restrictTo('admin'),
    levelHistoryController.createLevelHistory
  );

router
  .route('/:id')
  .get(levelHistoryController.getLevelHistory)
  .patch(
    authController.restrictTo('admin'),
    levelHistoryController.updateLevelHistory
  )
  .delete(
    authController.restrictTo('admin'),
    levelHistoryController.deleteLevelHistory
  );

module.exports = router;
