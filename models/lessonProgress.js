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
  nextReview: {
    type: String,
    required: false,
  },
});

const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);

module.exports = LessonProgress;
