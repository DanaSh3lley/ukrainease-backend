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
    enum: ['notOpened', 'notStarted', 'inProgress', 'completed', 'needReview'],
  },
  attempts: {
    type: [
      {
        userAnswer: String,
        isCorrect: Boolean,
        timestamp: Date,
        percentageCorrect: Number,
        coinsEarned: Number,
        experiencePointsEarned: Number,
      },
    ],
    required: true,
  },
  nextReview: {
    type: Date,
    required: true,
  },
});

const QuestionProgress = mongoose.model(
  'QuestionProgress',
  questionProgressSchema
);

module.exports = QuestionProgress;
