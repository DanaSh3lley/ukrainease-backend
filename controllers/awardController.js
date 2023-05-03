const factory = require('./handlerFactory');
const Award = require('../models/awardModel');

exports.getAward = factory.getOne(Award);
exports.getAllAwards = factory.getAll(Award);
exports.createAward = factory.createOne(Award);
exports.updateAward = factory.updateOne(Award);
exports.deleteAward = factory.deleteOne(Award);
