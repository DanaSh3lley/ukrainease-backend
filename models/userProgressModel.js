const mongoose = require('mongoose');
const CriteriaTypes = require('../utils/criteriaTypes');

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  award: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Award',
    required: true,
  },
  criteriaType: {
    type: String,
    enum: Object.values(CriteriaTypes),
    required: true,
  },
  currentCount: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 0,
  },
  history: [
    {
      level: {
        type: Number,
        required: true,
      },
      achievedDate: {
        type: Date,
        default: null,
      },
    },
  ],
});

const UserProgress = mongoose.model('UserProgress', UserProgressSchema);

module.exports = UserProgress;
