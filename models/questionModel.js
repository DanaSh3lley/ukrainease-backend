const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  type: {
    type: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Type',
        required: true,
      },
    ],
    required: true,
  },
  options: {
    type: [{ value: String, isCorrect: Boolean }],
    required: true,
  },
  explanation: {
    type: String,
    required: false,
  },
  hint: {
    type: String,
    required: false,
  },
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
