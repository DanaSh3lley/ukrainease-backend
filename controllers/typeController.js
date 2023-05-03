const Type = require('../models/typeModel');
const factory = require('./handlerFactory');

exports.getType = factory.getOne(Type);
exports.getAllTypes = factory.getAll(Type);
exports.createType = factory.createOne(Type);
exports.updateType = factory.updateOne(Type);
exports.deleteType = factory.deleteOne(Type);
