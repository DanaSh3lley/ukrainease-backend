const express = require('express');
const userAwardController = require('../controllers/userAwardController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(userAwardController.getAllUserAwards)
  .post(
    authController.restrictTo('admin'),
    userAwardController.createUserAward
  );

router
  .route('/:id')
  .get(userAwardController.getUserAward)
  .patch(
    authController.restrictTo('admin'),
    userAwardController.updateUserAward
  )
  .delete(
    authController.restrictTo('admin'),
    userAwardController.deleteUserAward
  );

module.exports = router;
