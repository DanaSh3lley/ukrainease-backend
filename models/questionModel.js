const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  questionType: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Type',
      required: true,
      default: [],
    },
  ],
  options: {
    type: [{ value: String, isCorrect: Boolean }],
    required: true,
    maxLength: 8,
    minLength: 1,
  },
  explanation: {
    type: String,
    required: false,
  },
  hint: {
    type: String,
    required: false,
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
