const mongoose = require('mongoose');

const dailyExperienceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
});

const DailyExperience = mongoose.model(
  'DailyExperience',
  dailyExperienceSchema
);

module.exports = DailyExperience;
