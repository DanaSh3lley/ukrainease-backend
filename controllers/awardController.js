const factory = require('./handlerFactory');
const Award = require('../models/awardModel');
const catchAsync = require('../utils/catchAsync');
const UserProgress = require('../models/userProgressModel');

function getLevelStatus(userProgress, level) {
  if (userProgress) {
    if (level <= userProgress.level) {
      return 'completed';
    }
    if (level === userProgress.level + 1) {
      return 'in progress';
    }
  }
  return 'not started';
}

function getAwardLevelsStatus(userProgress, levels) {
  return levels.map((level) => ({
    level: level.level,
    status: getLevelStatus(userProgress, level.level),
  }));
}

async function getAwardStatus(userId, award) {
  const awardId = award._id;

  const userProgress = await UserProgress.findOne({
    user: userId,
    award: awardId,
  }).populate('award');

  const awardStatus = {
    award: award,
    status: [],
  };

  if (userProgress) {
    awardStatus.status = getAwardLevelsStatus(
      userProgress,
      award.criteria.levels
    );
  } else {
    awardStatus.status = getAwardLevelsStatus(null, award.criteria.levels);
  }

  return awardStatus;
}

exports.getAwardsWithCompletionStatus = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const awards = await Award.find();

  const awardStatusList = await Promise.all(
    awards.map(async (award) => await getAwardStatus(userId, award))
  );

  res.json(awardStatusList);
});

exports.getAward = factory.getOne(Award);
exports.getAllAwards = factory.getAll(Award);
exports.createAward = factory.createOne(Award);
exports.updateAward = factory.updateOne(Award);
exports.deleteAward = factory.deleteOne(Award);
