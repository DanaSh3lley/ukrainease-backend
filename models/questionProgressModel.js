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
        type: mongoose.Schema.ObjectId,
        ref: 'Answer',
        required: true,
      },
    ],
    required: true,
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
