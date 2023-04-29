const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: 'string',
    required: true,
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
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
