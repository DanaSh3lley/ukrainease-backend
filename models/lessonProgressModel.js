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
        type: mongoose.Schema.ObjectId,
        ref: 'Answer',
        required: true,
      },
    ],
    required: true,
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

const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);

module.exports = LessonProgress;
