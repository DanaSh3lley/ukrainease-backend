const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
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
  groups: {
    type: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Group',
        required: true,
      },
    ],
    required: true,
  },
  required: true,
});

const League = mongoose.model('League', leagueSchema);

module.exports = League;
