const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
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
  coins: {
    type: String,
    required: true,
  },
  experiencePoints: {
    type: String,
    required: true,
  },
});

const Award = mongoose.model('Award', awardSchema);

module.exports = Award;
