const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: 40,
    minLength: 6,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 140,
    minLength: 10,
  },
  icon: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return /\.(jpg|jpeg|png|gif)$/.test(value);
      },
      message: (props) => `${props.value} is not a valid image file format!`,
    },
  },
  coins: {
    type: Number,
    required: true,
    min: 0,
  },
  experiencePoints: {
    type: Number,
    required: true,
    min: 0,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  category: {
    type: String,
    required: true,
    enum: ['Grammar', 'Vocabulary', 'Typical Error', 'Holiday', 'Other'],
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

const Award = mongoose.model('Award', awardSchema);

module.exports = Award;
