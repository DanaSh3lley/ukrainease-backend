const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'singleChoice',
      'multipleChoice',
      'trueFalse',
      'fillBlank',
      'shortAnswer',
      'matching',
      'card',
    ],
    required: true,
  },
  options: {
    type: [
      {
        text: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
    required: false,
  },
  matchingOptions: {
    type: [
      {
        left: {
          type: String,
          required: true,
        },
        right: {
          type: String,
          required: true,
        },
      },
    ],
    required: false,
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
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
