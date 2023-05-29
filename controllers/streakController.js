const DailyExperience = require('../models/dailyExperienceModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.calculateStreak = catchAsync(async (userId) => {
  const currentDate = new Date();
  const currentDay = currentDate.toISOString().split('T')[0];

  const todayExperience = await DailyExperience.findOne({
    user: userId,
    date: currentDay,
  });

  const user = await User.findById(userId);
  const streakCount = user.streak;

  if (todayExperience && todayExperience.points >= 100) {
    user.streak = streakCount + 1;
  } else {
    user.streak = 0;
  }

  await user.save({ validateBeforeSave: false });
});
