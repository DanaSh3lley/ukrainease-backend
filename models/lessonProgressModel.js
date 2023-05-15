const mongoose = require('mongoose');

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
  }, // New field to indicate if the lesson is opened/purchased
  status: {
    type: String,
    enum: ['notStarted', 'inProgress', 'completed'],
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

const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);

module.exports = LessonProgress;
