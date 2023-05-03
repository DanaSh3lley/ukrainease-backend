const Question = require('../models/questionModel');
const factory = require('./handlerFactory');

exports.getQuestion = factory.getOne(Question);
exports.getAllQuestions = factory.getAll(Question);
exports.createQuestion = factory.createOne(Question);
exports.updateQuestion = factory.updateOne(Question);
exports.deleteQuestion = factory.deleteOne(Question);
