const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  lessonType: {
    type: String,
    required: true,
    enum: ['grammar', 'vocabulary', 'typicalError'],
  },
  questions: {
    type: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Question',
        required: true,
      },
    ],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  baseCoins: {
    type: Number,
    required: true,
  },
});

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
