const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: 'string',
    required: true,
    maxLength: 40,
    minLength: 4,
  },
  users: {
    type: [mongoose.Schema.ObjectId],
    ref: 'User',
    required: true,
    default: [],
  },
});
const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
