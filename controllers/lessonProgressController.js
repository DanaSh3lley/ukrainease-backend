const LessonProgress = require('../models/lessonProgressModel');
const factory = require('./handlerFactory');
const Lesson = require('../models/lessonModel');

exports.getLessonProgress = factory.getOne(LessonProgress);
exports.getAllLessonProgresss = factory.getAll(LessonProgress);
exports.createLessonProgress = factory.createOne(LessonProgress);
exports.updateLessonProgress = factory.updateOne(LessonProgress);
exports.deleteLessonProgress = factory.deleteOne(LessonProgress);

exports.getRecommendedLessons = async (req, res, next) => {
  const userId = req.user.id;

  const lessonProgress = await LessonProgress.find({
    user: userId,
  }).distinct('lesson');

  const lessonsWithoutProgress = await Lesson.find({
    _id: { $nin: lessonProgress },
  });

  return res.status(200).json({
    grammar: lessonsWithoutProgress
      .filter((el) => el.lessonType === 'grammar')
      .slice(0, 3),
    vocabulary: lessonsWithoutProgress
      .filter((el) => el.lessonType === 'vocabulary')
      .slice(0, 3),
    typicalError: lessonsWithoutProgress
      .filter((el) => el.lessonType === 'typicalError')
      .slice(0, 3),
  });
};

exports.getLessonsThatNeedToReview = async (req, res, next) => {
  const userId = req.user.id;
  const lessonProgress = await LessonProgress.find({
    nextReview: { $lte: Date.now() },
    user: userId,
  }).populate('lesson');

  const lessons = lessonProgress.map((progress) => progress.lesson);

  return res.status(200).json({
    grammar: lessons.filter((el) => el.lessonType === 'grammar').slice(0, 3),
    vocabulary: lessons
      .filter((el) => el.lessonType === 'vocabulary')
      .slice(0, 3),
    typicalError: lessons
      .filter((el) => el.lessonType === 'typicalError')
      .slice(0, 3),
  });
};
