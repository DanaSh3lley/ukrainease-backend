const Award = require('../models/awardModel');
const {
  incrementUserProgress,
  checkAwardAchievement,
} = require('./progressTracker');
const AppError = require('./appError');

exports.checkAward = async (type, userId, incrementValue = 1) => {
  const questionsAnsweredAward = await Award.findOne({
    'criteria.type': type,
  });
  const progressId = questionsAnsweredAward._id;
  if (questionsAnsweredAward) {
    await incrementUserProgress(userId, progressId, type, incrementValue);
    await checkAwardAchievement(userId, progressId, type);
  } else {
    return new AppError('Award not found', 404);
  }
};
