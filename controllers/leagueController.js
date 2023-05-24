const League = require('../models/leagueModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Group = require('../models/groupModel');
const DailyExperience = require('../models/dailyExperienceModel');

exports.getLeague = factory.getOne(League);
exports.getAllLeagues = factory.getAll(League);
exports.createLeague = factory.createOne(League);
exports.updateLeague = factory.updateOne(League);
exports.deleteLeague = factory.deleteOne(League);

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

exports.distributeUsersToGroups = catchAsync(async (req, res, next) => {
  const leagues = await League.find().populate('groups');
  const users = await User.find();

  shuffleArray(users);

  leagues.forEach((league) => {
    league.groups.forEach((group) => (group.users = []));
  });

  leagues.forEach((league) => {
    const usersInLeague = users.filter((user) =>
      league._id.equals(user.league)
    );

    const groupLength = league.groups.length;
    const requiredGroupCount = Math.ceil(usersInLeague.length / 10);

    for (let i = groupLength; i < requiredGroupCount; i++) {
      const newGroup = new Group({
        name: `${league.name}-group-${i + 1}`,
        users: [],
      });
      league.groups.push(newGroup);
    }

    usersInLeague.forEach((user) => {
      const userGroup = league.groups.find((group) => group.users.length < 10);
      userGroup.users.push(user._id);
    });
  });

  const groupSavePromises = leagues.flatMap((league) =>
    league.groups.map((group) => group.save())
  );

  await Promise.all(groupSavePromises);

  // Delete empty groups
  const emptyGroupIds = [];
  leagues.forEach((league) => {
    league.groups = league.groups.filter((group) => {
      if (group.users.length === 0) {
        emptyGroupIds.push(group._id);
        return false;
      }
      return true;
    });
  });

  await Group.deleteMany({ _id: { $in: emptyGroupIds } });

  const allGroups = await Group.find();

  const groupsToDelete = allGroups.filter(
    (group) =>
      !leagues.some((league) =>
        league.groups.some((g) => g._id.equals(group._id))
      )
  );

  const deletePromises = groupsToDelete.map((group) =>
    Group.deleteOne({ _id: group._id })
  );
  await Promise.all(deletePromises);

  await Promise.all(leagues.map((league) => league.save()));

  res.status(200).json({
    status: 'success',
    message: 'Users distributed to groups successfully.',
  });
});

exports.moveUsersBetweenLeagues = catchAsync(async (req, res, next) => {
  const { startDate, finishDate } = req.body;

  const leagues = await League.find().populate({
    path: 'groups',
    populate: {
      path: 'users',
      model: 'User',
    },
  });

  leagues.sort((leagueA, leagueB) => leagueA.level - leagueB.level);

  leagues.map(async (league, i) => {
    league.groups.map(async (group) => {
      group.users.sort(async (userA, userB) => {
        const userADailyExp = await DailyExperience.find({
          user: userA._id,
          date: { $gte: startDate, $lte: finishDate },
        });

        const userBDailyExp = await DailyExperience.find({
          user: userB._id,
          date: { $gte: startDate, $lte: finishDate },
        });

        const userATotalExp = userADailyExp.reduce(
          (totalExp, exp) => totalExp + exp.experience,
          0
        );
        const userBTotalExp = userBDailyExp.reduce(
          (totalExp, exp) => totalExp + exp.experience,
          0
        );

        return userATotalExp - userBTotalExp;
      });

      const usersCount = group.users.length;

      if (usersCount >= 4) {
        const usersToMoveToNext = group.users.slice(0, 3);
        const usersToMoveToPrev = group.users.slice(-3);
        const nextLeague = leagues[i + 1];
        const prevLeague = leagues[i - 1];

        if (nextLeague) {
          const updateUserPromises = usersToMoveToNext.map((user) => {
            user.league = nextLeague._id;
            return user.save({ validateBeforeSave: false });
          });

          await Promise.all(updateUserPromises);
        }

        if (prevLeague) {
          const updateUserPromises = usersToMoveToPrev.map((user) => {
            user.league = prevLeague._id;
            return user.save({ validateBeforeSave: false });
          });

          await Promise.all(updateUserPromises);
        }
      }
    });
  });

  await Promise.all(leagues.map((league) => league.save()));

  res.status(200).json({
    status: 'success',
    message: 'Users moved between leagues successfully.',
  });
});
