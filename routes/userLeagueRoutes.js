const express = require('express');
const userLeagueController = require('../controllers/userLeagueController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(userLeagueController.getAllUserLeagues)
  .post(
    authController.restrictTo('admin'),
    userLeagueController.createUserLeague
  );

router
  .route('/:id')
  .get(userLeagueController.getUserLeague)
  .patch(
    authController.restrictTo('admin'),
    userLeagueController.updateUserLeague
  )
  .delete(
    authController.restrictTo('admin'),
    userLeagueController.deleteUserLeague
  );

module.exports = router;
