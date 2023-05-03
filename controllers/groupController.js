const Group = require('../models/groupModel');
const factory = require('./handlerFactory');

exports.getGroup = factory.getOne(Group);
exports.getAllGroups = factory.getAll(Group);
exports.createGroup = factory.createOne(Group);
exports.updateGroup = factory.updateOne(Group);
exports.deleteGroup = factory.deleteOne(Group);
