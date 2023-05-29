const cron = require('node-cron');
const User = require('../models/userModel');
const catchAsync = require('./catchAsync');
const { calculateStreak } = require('../controllers/streakController');

exports.scheduleStreak = function () {
  cron.schedule(
    '0 0 * * *',
    catchAsync(async () => {
      const users = await User.find();
      await Promise.all(
        users.map(async (user) => {
          await calculateStreak(user._id);
        })
      );
    })
  );
};
