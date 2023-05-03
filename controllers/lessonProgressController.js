const LessonProgress = require('../models/lessonProgressModel');
const factory = require('./handlerFactory');

exports.getLessonProgress = factory.getOne(LessonProgress);
exports.getAllLessonProgresss = factory.getAll(LessonProgress);
exports.createLessonProgress = factory.createOne(LessonProgress);
exports.updateLessonProgress = factory.updateOne(LessonProgress);
exports.deleteLessonProgress = factory.deleteOne(LessonProgress);
