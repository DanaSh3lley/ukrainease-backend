const Notification = require('../models/notificationModel');
const LevelHistory = require('../models/levelHistoryModel');
const DailyExperience = require('../models/dailyExperienceModel');
const { levelThresholds } = require('./level');
const UserProgress = require('../models/userProgressModel');
const League = require('../models/leagueModel');

const increaseCoins = (user, amount) => {
  const earnedCoins = Math.round(amount * user.coinEarningCoefficient);
  user.coins += earnedCoins;
  return earnedCoins;
};

const increaseExperiencePoints = (user, amount) => {
  const earnedPoints = Math.round(amount * user.experienceEarningCoefficient);
  user.experiencePoints += earnedPoints;
  return earnedPoints;
};

async function calculateCoefficient(user) {
  let coefficient = 1.0;

  // Calculate level coefficient
  const levelCoefficient = user.level * 0.05;
  coefficient += levelCoefficient;

  // Calculate league coefficient (replace 'user.league' with the actual property representing the user's league)
  const league = await League.findById(user.league);
  if (league) {
    const leagueCoefficient = league.level * 0.05;
    coefficient += leagueCoefficient;
  }

  // Calculate streak coefficient (replace 'user.streak' with the actual property representing the user's streak)
  const streakCoefficient = user.streak * 0.2;
  coefficient += streakCoefficient;

  // Calculate award coefficient
  const userProgress = await UserProgress.find({ user: user._id }).populate(
    'award'
  );
  const awardCoefficients = userProgress.map(
    (progress) => progress.level * 0.005
  );
  coefficient += awardCoefficients.reduce((acc, val) => acc + val, 0);

  return coefficient;
}

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

async function assignEarnings(user, pointsEarned) {
  const currentDate = new Date().toISOString().slice(0, 10); // Get the current date in YYYY-MM-DD format

  const experience = increaseExperiencePoints(user, pointsEarned);

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
    dailyExperienceEntry.points += experience;
    await dailyExperienceEntry.save();
  } else {
    // If no entry exists, create a new entry for the current date
    const newDailyExperienceEntry = new DailyExperience({
      user: user._id,
      date: new Date(currentDate),
      points: experience,
    });
    await newDailyExperienceEntry.save();
  }

  // Calculate the user's new level based on the updated experience points
  const userLevel = calculateUserLevel(user.experiencePoints);

  if (user.level !== userLevel) {
    user.level = userLevel;
    user.nextLevelRequired = levelThresholds[user.level];
    const coefficient = await calculateCoefficient(user);
    user.coinEarningCoefficient = coefficient;
    user.experienceEarningCoefficient = coefficient;

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

module.exports = {
  assignEarnings,
  increaseCoins,
  increaseExperiencePoints,
  calculateCoefficient,
};
