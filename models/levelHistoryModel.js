const mongoose = require('mongoose');

const levelHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const LevelHistory = mongoose.model('LevelHistory', levelHistorySchema);

module.exports = LevelHistory;
