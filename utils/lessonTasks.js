const cron = require('node-cron');
const catchAsync = require('./catchAsync');
const User = require('../models/userModel');
const { changeLessonStatus } = require('../controllers/lessonController');
const LessonProgress = require('../models/lessonProgressModel');

exports.lessonStatusTask = function () {
  cron.schedule(
    '0 0 * * *',
    catchAsync(async () => {
      const lessonProgress = await LessonProgress.find();
      await Promise.all(
        lessonProgress.map(async (lesson) => {
          await changeLessonStatus(lesson);
        })
      );
    })
  );
};
