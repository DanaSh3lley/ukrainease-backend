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
    enum: ['error', 'new', 'review', 'mastered'],
    default: 'new',
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
  repetitionNumber: {
    type: Number,
    required: true,
    default: 0,
  },
  ease: {
    type: Number,
    required: true,
    default: 2.5,
  },
  interval: {
    type: Number,
    required: true,
    default: 1,
  },
  nextReview: {
    type: Date,
    required: true,
  },
});

questionProgressSchema.path('nextReview').get((value) => {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return value;
});

// Define a setter for the 'nextReview' field to handle string input and convert it to a Date object
questionProgressSchema.path('nextReview').set((value) => {
  if (typeof value === 'string') {
    return new Date(value);
  }
  return value;
});

const QuestionProgress = mongoose.model(
  'QuestionProgress',
  questionProgressSchema
);

module.exports = QuestionProgress;
