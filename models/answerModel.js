const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  percentCorrect: {
    type: Number,
    required: true,
    default: 0,
  },
  receivedCoins: {
    type: Number,
    required: true,
    default: 0,
  },
  receivedExperienceCoins: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
