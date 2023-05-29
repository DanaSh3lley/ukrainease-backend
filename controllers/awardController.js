const factory = require('./handlerFactory');
const Award = require('../models/awardModel');
const catchAsync = require('../utils/catchAsync');
const UserProgress = require('../models/userProgressModel');

exports.getAwardsWithCompletionStatus = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming you have the user ID in the request

    // Retrieve all awards
    const awards = await Award.find();

    // Initialize the result array
    const awardStatusList = [];

    // Iterate through each award
    for (const award of awards) {
      const awardId = award._id;

      // Find the user's progress for the current award
      const userProgress = await UserProgress.findOne({
        user: userId,
        award: awardId,
      });

      // Define the status object for the award
      const awardStatus = {
        award: award.name,
        status: [],
      };

      // If the user has progress for the award
      if (userProgress) {
        const awardLevels = award.criteria.levels;

        // Iterate through each level of the award
        for (const level of awardLevels) {
          const levelStatus = {
            level: level.level,
            status: '',
          };

          // Check the status of the level based on the user's progress
          if (level.level <= userProgress.level) {
            levelStatus.status = 'completed';
          } else if (level.level === userProgress.level + 1) {
            levelStatus.status = 'in progress';
          } else {
            levelStatus.status = 'not started';
          }

          // Add the level status to the award status object
          awardStatus.status.push(levelStatus);
        }
      } else {
        // If the user has no progress for the award, set all levels as 'not started'
        const awardLevels = award.criteria.levels;

        for (const level of awardLevels) {
          const levelStatus = {
            level: level.level,
            status: 'not started',
          };

          awardStatus.status.push(levelStatus);
        }
      }

      // Add the award status object to the result array
      awardStatusList.push(awardStatus);
    }

    res.json(awardStatusList);
  } catch (error) {
    next(error);
  }
});

exports.getAward = factory.getOne(Award);
exports.getAllAwards = factory.getAll(Award);
exports.createAward = factory.createOne(Award);
exports.updateAward = factory.updateOne(Award);
exports.deleteAward = factory.deleteOne(Award);
