const DailyExperience = require('../models/dailyExperienceModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getDailyExperience = factory.getOne(DailyExperience);
exports.getAllDailyExperiences = factory.getAll(DailyExperience);
exports.createDailyExperience = factory.createOne(DailyExperience);
exports.updateDailyExperience = factory.updateOne(DailyExperience);
exports.deleteDailyExperience = factory.deleteOne(DailyExperience);

exports.getUserDailyExperienceHistory = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  const dailyExperiences = await DailyExperience.find({ user: userId });
  return res.status(200).json({
    dailyExperiences,
  });
});
