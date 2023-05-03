const UserLeague = require('../models/userLeagueModel');
const factory = require('./handlerFactory');

exports.getUserLeague = factory.getOne(UserLeague);
exports.getAllUserLeagues = factory.getAll(UserLeague);
exports.createUserLeague = factory.createOne(UserLeague);
exports.updateUserLeague = factory.updateOne(UserLeague);
exports.deleteUserLeague = factory.deleteOne(UserLeague);
