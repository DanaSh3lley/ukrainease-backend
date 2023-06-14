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
        userAnswer: mongoose.Schema.Types.Mixed,
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

questionProgressSchema.path('nextReview').set((value) => {
  if (typeof value === 'string') {
    return new Date(value);
  }
  return value;
});

questionProgressSchema.pre('save', async function (next) {
  if (this.isModified('nextReview')) {
    const currentDate = new Date(this.nextReview);
    currentDate.setUTCHours(0, 0, 0, 0);
    this.nextReview = currentDate;
  }
  next();
});

const QuestionProgress = mongoose.model(
  'QuestionProgress',
  questionProgressSchema
);

module.exports = QuestionProgress;
