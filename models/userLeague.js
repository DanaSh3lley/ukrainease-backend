const mongoose = require('mongoose');

const userLeagueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'League',
    required: true,
  },
});

const UserLeague = mongoose.model('UserLeague', userLeagueSchema);

module.exports = UserLeague;
