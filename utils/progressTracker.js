const UserProgress = require('../models/userProgressModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const Award = require('../models/awardModel');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

const incrementUserProgress = async (
  userId,
  awardId,
  criteriaType,
  incrementValue = 1
) => {
  let userProgress = await UserProgress.findOne({
    user: userId,
    award: awardId,
    criteriaType,
  });

  if (!userProgress) {
    userProgress = new UserProgress({
      user: userId,
      award: awardId,
      criteriaType,
    });
  }

  userProgress.currentCount += incrementValue;

  await userProgress.save();

  return userProgress;
};

const checkAwardAchievement = async (userId, awardId, criteriaType) => {
  let userProgress = await UserProgress.findOne({
    user: userId,
    award: awardId,
    criteriaType,
  }).populate('award');

  if (!userProgress) {
    const award = await Award.findById(awardId);

    const initialLevel = 0;
    const initialCount = 0;

    userProgress = new UserProgress({
      user: userId,
      award: awardId,
      criteriaType,
      level: initialLevel,
      currentCount: initialCount,
    });

    await userProgress.save();
  }

  const awardLevels = userProgress.award.criteria.levels;
  const currentLevel = userProgress.level;

  const level = awardLevels.find((l) => l.level === currentLevel);
  if (!level) {
    return false;
  }

  const { targetQuantity } = level;

  if (userProgress.currentCount >= targetQuantity) {
    const nextLevel = awardLevels.find((l) => l.level === currentLevel + 1);

    if (nextLevel) {
      const nextTargetQuantity = nextLevel.targetQuantity;

      if (userProgress.currentCount >= nextTargetQuantity) {
        userProgress.level += 1;
        await userProgress.save({ validateBeforeSave: false });

        const notification = new Notification({
          recipient: userId,
          message: `Congratulations! You achieved new award.`,
          importance: 'low',
        });

        await notification.save();

        const { award } = userProgress;
        const coinsEarned = award.coins;
        const experiencePointsEarned = award.experiencePoints;

        const user = await User.findById(userId);
        user.coins += coinsEarned;
        user.experiencePoints += experiencePointsEarned;
        await user.save({ validateBeforeSave: false });

        return true;
      }
    } else {
      return true;
    }
  }

  return false;
};

module.exports = {
  incrementUserProgress: catchAsync(incrementUserProgress),
  checkAwardAchievement: catchAsync(checkAwardAchievement),
};
