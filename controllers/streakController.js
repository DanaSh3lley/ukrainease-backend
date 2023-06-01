const DailyExperience = require('../models/dailyExperienceModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { calculateCoefficient } = require('../utils/levelService');
const { checkAward } = require('../utils/award');
const CriteriaTypes = require('../utils/criteriaTypes');

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
    await checkAward(CriteriaTypes.DAY_STREAK, userId);
  } else {
    await checkAward(CriteriaTypes.DAY_STREAK, userId, 0);
    user.streak = 0;
  }
  const coefficient = await calculateCoefficient(user);
  user.coinEarningCoefficient = coefficient;
  user.experienceEarningCoefficient = coefficient;
  await user.save({ validateBeforeSave: false });
});
