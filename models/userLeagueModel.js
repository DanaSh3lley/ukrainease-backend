const mongoose = require('mongoose');

const userLeagueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  league: {
    type: mongoose.Schema.ObjectId,
    ref: 'League',
    required: true,
  },
  lastUpdate: {
    type: Date,
    required: false,
    default: Date.now(),
  },
});

const UserLeagueModel = mongoose.model('UserLeagueModel', userLeagueSchema);

module.exports = UserLeagueModel;
