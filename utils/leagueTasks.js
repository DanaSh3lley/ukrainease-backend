const cron = require('node-cron');
const Group = require('../models/groupModel');
const DailyExperience = require('../models/dailyExperienceModel');
const League = require('../models/leagueModel');
const User = require('../models/userModel');
const { checkAward } = require('./award');
const CriteriaTypes = require('./criteriaTypes');

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getCurrentWeekDates() {
  const now = new Date();
  const currentDay = now.getDay(); // Get the current day of the week (0 = Sunday, 1 = Monday, ...)
  const startOfWeek = new Date(now); // Clone the current date
  const endOfWeek = new Date(now); // Clone the current date

  const diff = currentDay - 1; // Calculate the difference between the current day and Monday
  startOfWeek.setDate(now.getDate() - diff); // Subtract the difference from the current date

  const diffEnd = 7 - currentDay; // Calculate the difference between Sunday and the current day
  endOfWeek.setDate(now.getDate() + diffEnd); // Add the difference to the current date

  startOfWeek.setHours(0, 0, 0, 0); // Set the time to 00:00:00
  endOfWeek.setHours(23, 59, 59, 999); // Set the time to 23:59:59.999

  return {
    startOfWeek,
    endOfWeek,
  };
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

function distributeUsers(leagues, users) {
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

async function moveUsersToLeague(users, leagueId, type) {
  const updateUserPromises = users.map(async (user) => {
    if (type === 'next')
      await checkAward(CriteriaTypes.NEXT_LEAGUE, user._id, 1);
    if (type === 'prev')
      await checkAward(CriteriaTypes.NEXT_LEAGUE, user._id, -1);
    user.league = leagueId;
    return user.save({ validateBeforeSave: false });
  });

  await Promise.all(updateUserPromises);
}

const distributeUsersToGroups = async () => {
  const leagues = await League.find().populate('groups');
  const users = await User.find();

  shuffleArray(users);

  resetGroupUsers(leagues);
  createMissingGroups(leagues, users);
  distributeUsers(leagues, users);

  await saveGroups(leagues);
  await deleteEmptyGroups(leagues);
  await deleteUnusedGroups(leagues);

  await saveLeagues(leagues);
};

const moveUsersBetweenLeagues = async () => {
  const { startOfWeek, endOfWeek } = getCurrentWeekDates();

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
            startOfWeek,
            endOfWeek
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
};

exports.leagueTask = () => {
  cron.schedule('* * * * 1', async () => {
    await moveUsersBetweenLeagues();
    await distributeUsersToGroups();
  });
};
