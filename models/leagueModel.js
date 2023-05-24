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
    default: 'league.jpg',
  },
  groups: {
    type: [mongoose.Schema.ObjectId],
    ref: 'Group',
    required: true,
    default: [],
  },
  level: {
    type: Number,
    required: true,
  },
});

const League = mongoose.model('League', leagueSchema);

module.exports = League;
