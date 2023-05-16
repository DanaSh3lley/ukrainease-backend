const Notification = require('../models/NotificationModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getNotification = factory.getOne(Notification);
exports.getAllNotifications = factory.getAll(Notification);
exports.createNotification = factory.createOne(Notification);
exports.updateNotification = factory.updateOne(Notification);
exports.deleteNotification = factory.deleteOne(Notification);

exports.getUserNotifications = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const notifications = await Notification.find({ recipient: userId });
  return res.status(200).json({
    userId,
    notifications,
  });
});

exports.markNotificationAsRead = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const { id: userId } = req.user;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  return res.status(200).json({
    notification,
  });
});

exports.markAllNotificationsAsRead = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );

  return res.status(200).json({
    message: 'All notifications marked as read.',
  });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  const { notificationId } = req.params;
  const { id: userId } = req.user;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  return res.status(200).json({
    message: 'Notification deleted.',
  });
});

exports.getUnreadNotifications = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const notifications = await Notification.find({
    recipient: userId,
    read: false,
  });
  return res.status(200).json({
    userId,
    notifications,
  });
});
