const League = require('../models/leagueModel');
const factory = require('./handlerFactory');
const User = require('../models/userModel');
const Group = require('../models/groupModel');
const DailyExperience = require('../models/dailyExperienceModel');

exports.getLeague = factory.getOne(League);
exports.getAllLeagues = factory.getAll(League);
exports.createLeague = factory.createOne(League);
exports.updateLeague = factory.updateOne(League);
exports.deleteLeague = factory.deleteOne(League);

async function sortUsersByExperience(users) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() - ((weekEnd.getDay() + 6) % 7) + 6);
  const userExperiencePromises = users.map(async (user) => {
    const userDailyExp = await DailyExperience.find({
      user: user,
      date: { $gte: weekStart, $lte: weekEnd },
    });
    const userTotalExp = userDailyExp.reduce(
      (totalExp, exp) => totalExp + exp.points,
      0
    );
    return { user, totalExperience: userTotalExp };
  });

  const sortedUsers = await Promise.all(userExperiencePromises);
  sortedUsers.sort(
    (userA, userB) => userB.totalExperience - userA.totalExperience
  );

  return sortedUsers;
}

exports.getUserLeague = async (req, res, next) => {
  const { id: userId } = req.user;
  const user = await User.findOne({ _id: userId }).populate('league');
  const group = await Group.findOne({ users: userId });
  await group.populate('users');

  const users = await sortUsersByExperience(group.users);

  const nextLeague = await League.find({ level: user.league.level + 1 });

  return res.status(200).json({
    group: users,
    league: user.league,
    nextLeague,
  });
};
