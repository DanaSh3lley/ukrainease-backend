const Notification = require('../models/NotificationModel');
const LevelHistory = require('../models/levelHistoryModel');
const DailyExperience = require('../models/dailyExperienceModel');

const levelThresholds = [0, 100, 250, 500, 1000];
const coinEarningCoefficients = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 2.0,
};

function calculateUserLevel(experiencePoints) {
  let level = 1;
  for (let i = 1; i < levelThresholds.length; i += 1) {
    if (experiencePoints >= levelThresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

async function assignExperiencePoints(user, pointsEarned) {
  const currentDate = new Date().toISOString().slice(0, 10); // Get the current date in YYYY-MM-DD format

  user.experiencePoints += pointsEarned;

  const startOfDay = new Date(currentDate).setHours(0, 0, 0);
  const endOfDay = new Date(currentDate).setHours(23, 59, 59);

  const dailyExperienceEntry = await DailyExperience.findOne({
    user: user._id,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (dailyExperienceEntry) {
    // If an entry exists, update the experience points for the current date
    dailyExperienceEntry.points += pointsEarned;
    await dailyExperienceEntry.save();
  } else {
    // If no entry exists, create a new entry for the current date
    const newDailyExperienceEntry = new DailyExperience({
      user: user._id,
      date: new Date(currentDate),
      points: pointsEarned,
    });
    await newDailyExperienceEntry.save();
  }

  // Calculate the user's new level based on the updated experience points
  const userLevel = calculateUserLevel(user.experiencePoints);

  if (user.level !== userLevel) {
    // If the user's level has changed, perform level-up actions
    user.level = userLevel;

    const notification = new Notification({
      recipient: user._id,
      message: `Congratulations! You have achieved level ${userLevel}.`,
      importance: 'high',
    });

    await notification.save();

    const levelHistoryEntry = new LevelHistory({
      userId: user._id,
      level: userLevel,
    });

    // Save the level history entry to the database
    await levelHistoryEntry.save();
  }
}

function calculateCoinsEarned(user, lessonCompletion) {
  const earningCoefficient = coinEarningCoefficients[user.level] || 0;
  user.coins += Math.round(earningCoefficient * lessonCompletion);
}

module.exports = {
  // calculateUserLevel,
  assignExperiencePoints,
  calculateCoinsEarned,
};
