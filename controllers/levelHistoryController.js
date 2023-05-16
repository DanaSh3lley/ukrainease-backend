const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const LevelHistory = require('../models/levelHistoryModel');

exports.getLevelHistory = factory.getOne(LevelHistory);
exports.getAllLevelHistorys = factory.getAll(LevelHistory);
exports.createLevelHistory = factory.createOne(LevelHistory);
exports.updateLevelHistory = factory.updateOne(LevelHistory);
exports.deleteLevelHistory = factory.deleteOne(LevelHistory);

exports.getUserLevelHistory = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const levelHistory = await LevelHistory.find({ userId });

  return res.status(200).json({
    levelHistory,
  });
});
