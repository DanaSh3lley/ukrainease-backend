const mongoose = require('mongoose');

const userAwardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  award: {
    type: mongoose.Schema.ObjectId,
    ref: 'Award',
    required: true,
  },
  date: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    required: true,
    enum: ['inProgress', 'received', 'cancelled'],
  },
});

const UserAward = mongoose.model('UserAward', userAwardSchema);

module.exports = UserAward;
