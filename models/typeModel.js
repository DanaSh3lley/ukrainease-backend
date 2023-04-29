const mongoose = require('mongoose');
const slugify = require('slugify');

const typeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['choose one', 'choose multiple', 'input field', 'card', 'pair'],
  },
  type: {
    type: String,
    required: true,
    default: function () {
      return slugify(this.name, '_');
    },
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: false,
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

const Type = mongoose.model('Type', typeSchema);

module.exports = Type;
