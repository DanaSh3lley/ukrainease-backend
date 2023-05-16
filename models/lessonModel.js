const mongoose = require('mongoose');
const slugify = require('slugify');

const lessonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slugify: {
    type: String,
    default: function () {
      return slugify(this.name, '_');
    },
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
  theory: {
    type: String,
    required: true,
    default: '',
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
  level: {
    type: Number,
    required: true,
    default: 1,
    max: 3,
    min: 1,
  },
  requiredLevel: {
    type: Number,
    required: true,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

lessonSchema.virtual('progress', {
  ref: 'LessonProgress',
  localField: '_id',
  foreignField: 'lesson',
  justOne: true,
  options: {
    select: { status: 1, opened: 1 },
  },
});

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = Lesson;
