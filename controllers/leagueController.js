const League = require('../models/leagueModel');
const factory = require('./handlerFactory');

exports.getLeague = factory.getOne(League);
exports.getAllLeagues = factory.getAll(League);
exports.createLeague = factory.createOne(League);
exports.updateLeague = factory.updateOne(League);
exports.deleteLeague = factory.deleteOne(League);
