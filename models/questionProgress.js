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
        date: Date,
        correct: Boolean,
        receivedCoins: Number,
        receivedExperienceCoins: Number,
      },
    ],
    required: false,
  },
  nextReview: {
    type: String,
    required: false,
  },
});

const QuestionProgress = mongoose.model(
  'QuestionProgress',
  questionProgressSchema
);

module.exports = QuestionProgress;
