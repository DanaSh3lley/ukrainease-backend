const mongoose = require('mongoose');

const questionProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: mongoose.Schema.ObjectId,
    ref: 'Question',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['notFinished', 'finished', 'needReview', 'notStarted'],
  },
  answers: {
    type: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        correct: {
          type: Boolean,
          required: true,
        },
        receivedCoins: {
          type: Number,
          required: true,
        },
        receivedExperienceCoins: {
          type: Number,
          required: true,
        },
      },
    ],
    required: false,
  },
  nextReview: {
    type: Date,
    required: false,
  },
});

const QuestionProgress = mongoose.model(
  'QuestionProgress',
  questionProgressSchema
);

module.exports = QuestionProgress;
