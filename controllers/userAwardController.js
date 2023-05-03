const UserAward = require('../models/userAwardModel');
const factory = require('./handlerFactory');

exports.getUserAward = factory.getOne(UserAward);
exports.getAllUserAwards = factory.getAll(UserAward);
exports.createUserAward = factory.createOne(UserAward);
exports.updateUserAward = factory.updateOne(UserAward);
exports.deleteUserAward = factory.deleteOne(UserAward);
