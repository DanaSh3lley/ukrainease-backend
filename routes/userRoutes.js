const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/verify-email', authController.sendVerification);
router.route('/verify-email/:token').get(authController.verifyEmail);

router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(authController.restrictTo('admin'), userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser);

module.exports = router;
