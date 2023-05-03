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
  status: {
    type: String,
    required: true,
    enum: ['notFinished', 'finished', 'needReview', 'notStarted'],
  },
  answers: {
    type: [
      {
        date: Date,
        percentCorrect: Number,
        receivedCoins: Number,
        receivedExperienceCoins: Number,
      },
    ],
    required: false,
  },
  currentQuestion: {
    type: Number,
    required: false,
    default: 0,
  },
  nextReview: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const LessonProgressModel = mongoose.model(
  'LessonProgressModel',
  lessonProgressSchema
);

module.exports = LessonProgressModel;
