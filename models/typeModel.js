const mongoose = require('mongoose');

const typeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'choose_one',
      'choose_multiple',
      'fill_in_the_blank',
      'card',
      'pair',
    ],
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: false,
  },
});

const Type = mongoose.model('Type', typeSchema);

module.exports = Type;
