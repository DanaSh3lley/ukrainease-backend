const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const lessonProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  opened: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['notStarted', 'needReview', 'inProgress', 'completed'],
    default: 'notStarted',
  },
  attempts: {
    type: [
      {
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        percentageCorrect: {
          type: Number,
          required: true,
        },
        coinsEarned: {
          type: Number,
          required: true,
        },
        experiencePointsEarned: {
          type: Number,
          required: true,
        },
      },
    ],
    required: true,
    default: [],
  },
  currentQuestion: {
    type: Number,
    required: false,
    default: 0,
  },
  nextReview: {
    type: Date,
    required: false,
    default: Date.now(),
  },
  sessionQuestions: {
    type: [mongoose.Schema.ObjectId],
    ref: 'Question',
    required: true,
    default: [],
  },
});

lessonProgressSchema.pre('save', async function (next) {
  this.nextReview = new Date(this.nextReview).setHours(0, 0, 0, 0);
  next();
});

const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);

module.exports = LessonProgress;
