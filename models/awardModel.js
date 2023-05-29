const mongoose = require('mongoose');
const CriteriaTypes = require('../utils/criteriaTypes');

const LevelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
  },
  targetQuantity: {
    type: Number,
    required: true,
  },
});

const AwardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  experiencePoints: {
    type: Number,
    required: true,
  },
  coins: {
    type: Number,
    required: true,
  },
  criteria: {
    type: {
      type: String,
      enum: Object.values(CriteriaTypes),
      required: true,
    },
    levels: [LevelSchema],
  },
});

const Award = mongoose.model('Award', AwardSchema);

module.exports = Award;
