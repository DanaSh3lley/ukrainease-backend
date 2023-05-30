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
  return array;
}

exports.shuffleArray = shuffleArray;

function resetGroupUsers(leagues) {
  leagues.forEach((league) => {
    league.groups.forEach((group) => {
      group.users = [];
    });
  });
}

function createMissingGroups(leagues, users) {
  leagues.forEach((league) => {
    const usersInLeague = users.filter((user) =>
      league._id.equals(user.league)
    );

    const groupLength = league.groups.length;
    const requiredGroupCount = Math.ceil(usersInLeague.length / 10);

    for (let i = groupLength; i < requiredGroupCount; i += 1) {
      const newGroup = new Group({
        name: `${league.name}-group-${i + 1}`,
        users: [],
      });
      league.groups.push(newGroup);
    }
  });
}

function distributeUsersToGroups(leagues, users) {
  leagues.forEach((league) => {
    const usersInLeague = users.filter((user) =>
      league._id.equals(user.league)
    );

    usersInLeague.forEach((user) => {
      const userGroup = league.groups.find((group) => group.users.length < 10);
      userGroup.users.push(user._id);
    });
  });
}

async function saveGroups(leagues) {
  const groupSavePromises = leagues.flatMap((league) =>
    league.groups.map((group) => group.save())
  );

  await Promise.all(groupSavePromises);
}

async function deleteEmptyGroups(leagues) {
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
}

async function deleteUnusedGroups(leagues) {
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
}

async function saveLeagues(leagues) {
  const savePromises = leagues.map((league) => league.save());
  await Promise.all(savePromises);
}

async function sortUsersByExperience(users, startDate, finishDate) {
  const userExperiencePromises = users.map(async (user) => {
    const userDailyExp = await DailyExperience.find({
      user: user._id,
      date: { $gte: startDate, $lte: finishDate },
    });

    const userTotalExp = userDailyExp.reduce(
      (totalExp, exp) => totalExp + exp.experience,
      0
    );

    return { user, totalExperience: userTotalExp };
  });

  const sortedUsers = await Promise.all(userExperiencePromises);

  sortedUsers.sort(
    (userA, userB) => userA.totalExperience - userB.totalExperience
  );

  return sortedUsers.map((sortedUser) => sortedUser.user);
}

async function moveUsersToLeague(users, leagueId) {
  const updateUserPromises = users.map((user) => {
    user.league = leagueId;
    return user.save({ validateBeforeSave: false });
  });

  await Promise.all(updateUserPromises);
}

exports.distributeUsersToGroups = catchAsync(async (req, res, next) => {
  const leagues = await League.find().populate('groups');
  const users = await User.find();

  shuffleArray(users);

  resetGroupUsers(leagues);
  createMissingGroups(leagues, users);
  distributeUsersToGroups(leagues, users);

  await saveGroups(leagues);
  await deleteEmptyGroups(leagues);
  await deleteUnusedGroups(leagues);

  await saveLeagues(leagues);

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

  await Promise.all(
    leagues.map(async (league, i) => {
      await Promise.all(
        league.groups.map(async (group) => {
          const sortedUsers = await sortUsersByExperience(
            group.users,
            startDate,
            finishDate
          );

          const usersCount = sortedUsers.length;

          if (usersCount >= 4) {
            const usersToMoveToNext = sortedUsers.slice(0, 3);
            const usersToMoveToPrev = sortedUsers.slice(-3);
            const nextLeague = leagues[i + 1];
            const prevLeague = leagues[i - 1];

            if (nextLeague) {
              await moveUsersToLeague(usersToMoveToNext, nextLeague._id);
            }

            if (prevLeague) {
              await moveUsersToLeague(usersToMoveToPrev, prevLeague._id);
            }
          }
        })
      );
    })
  );

  await Promise.all(leagues.map((league) => league.save()));

  res.status(200).json({
    status: 'success',
    message: 'Users moved between leagues successfully.',
  });
});
