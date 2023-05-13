const factory = require('./handlerFactory');
const Answer = require('../models/answerModel');

exports.getAnswer = factory.getOne(Answer);
exports.getAllAnswers = factory.getAll(Answer);
exports.createAnswer = factory.createOne(Answer);
exports.updateAnswer = factory.updateOne(Answer);
exports.deleteAnswer = factory.deleteOne(Answer);
