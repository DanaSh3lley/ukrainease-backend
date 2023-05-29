const UserProgress = require('../models/userProgressModel');
const factory = require('./handlerFactory');

exports.getUserProgress = factory.getOne(UserProgress);
exports.getAllUserProgresses = factory.getAll(UserProgress);
exports.createUserProgress = factory.createOne(UserProgress);
exports.updateUserProgress = factory.updateOne(UserProgress);
exports.deleteUserProgress = factory.deleteOne(UserProgress);
