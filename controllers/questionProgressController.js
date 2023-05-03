const QuestionProgress = require('../models/questionProgressModel');
const factory = require('./handlerFactory');

exports.getQuestionProgress = factory.getOne(QuestionProgress);
exports.getAllQuestionProgresss = factory.getAll(QuestionProgress);
exports.createQuestionProgress = factory.createOne(QuestionProgress);
exports.updateQuestionProgress = factory.updateOne(QuestionProgress);
exports.deleteQuestionProgress = factory.deleteOne(QuestionProgress);
