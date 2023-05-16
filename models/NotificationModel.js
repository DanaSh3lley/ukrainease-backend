const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  importance: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
