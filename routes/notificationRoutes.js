const express = require('express');
const notificationController = require('../controllers/notificationController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/user').get(notificationController.getUserNotifications);

router.route('/user/unread').get(notificationController.getUnreadNotifications);

router
  .route('/user/:notificationId')
  .delete(notificationController.deleteNotification);
router
  .route('/user/:notificationId/read')
  .put(notificationController.markNotificationAsRead);

router
  .route('/user/markAllAsRead')
  .put(notificationController.markAllNotificationsAsRead);

router
  .route('/')
  .get(notificationController.getAllNotifications)
  .post(
    authController.restrictTo('admin'),
    notificationController.createNotification
  );

router
  .route('/:id')
  .get(notificationController.getNotification)
  .patch(
    authController.restrictTo('admin'),
    notificationController.updateNotification
  )
  .delete(
    authController.restrictTo('admin'),
    notificationController.deleteNotification
  );
module.exports = router;
