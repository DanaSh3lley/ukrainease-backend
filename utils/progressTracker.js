const UserProgress = require('../models/userProgressModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const catchAsync = require('./catchAsync');
const {
  assignEarnings,
  increaseCoins,
  calculateCoefficient,
} = require('./levelService');

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
    const initialLevel = 0;
    const initialCount = 0;

    userProgress = new UserProgress({
      user: userId,
      award: awardId,
      criteriaType,
      level: initialLevel,
      currentCount: initialCount,
    }).populate('award');

    await userProgress.save();
  }

  const awardLevels = userProgress.award.criteria.levels;
  const currentLevel = userProgress.level;

  const level = awardLevels.find(
    (l) => l.level === currentLevel || currentLevel === 0
  );
  if (!level) {
    return false;
  }

  const { targetQuantity } = level;

  if (userProgress.currentCount >= targetQuantity) {
    const nextLevel = awardLevels.find((l) => l.level === currentLevel + 1);

    if (nextLevel) {
      const nextTargetQuantity = nextLevel.targetQuantity;

      if (userProgress.currentCount >= nextTargetQuantity) {
        userProgress.history.push({
          level: userProgress.level,
          achievedDate: Date.now(),
        });
        userProgress.level += 1;
        await userProgress.save();

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
        await assignEarnings(user, coinsEarned);
        increaseCoins(user, experiencePointsEarned);
        const coefficient = await calculateCoefficient(user);
        user.coinEarningCoefficient = coefficient;
        user.experienceEarningCoefficient = coefficient;
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
