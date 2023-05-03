const Lesson = require('../models/lessonModel');
const factory = require('./handlerFactory');

exports.getLesson = factory.getOne(Lesson);
exports.getAllLessons = factory.getAll(Lesson);
exports.createLesson = factory.createOne(Lesson);
exports.updateLesson = factory.updateOne(Lesson);
exports.deleteLesson = factory.deleteOne(Lesson);
