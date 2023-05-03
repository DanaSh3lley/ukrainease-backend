const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: 'string',
    required: true,
    maxLength: 40,
    minLength: 4,
  },
  users: {
    type: [
      {
        type: [mongoose.Schema.ObjectId],
        ref: 'User',
        required: true,
      },
    ],
    required: true,
  },
  description: {
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

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
