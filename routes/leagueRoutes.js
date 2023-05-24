const express = require('express');
const leagueController = require('../controllers/leagueController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/distribute').post(leagueController.distributeUsersToGroups);
router.route('/move-users').post(leagueController.moveUsersBetweenLeagues);

router
  .route('/')
  .get(leagueController.getAllLeagues)
  .post(authController.restrictTo('admin'), leagueController.createLeague);

router
  .route('/:id')
  .get(leagueController.getLeague)
  .patch(authController.restrictTo('admin'), leagueController.updateLeague)
  .delete(authController.restrictTo('admin'), leagueController.deleteLeague);

module.exports = router;
