const Notification = require('../models/NotificationModel');
const LevelHistory = require('../models/levelHistoryModel');

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
  user.experiencePoints += pointsEarned;
  const userLevel = calculateUserLevel(user.experiencePoints);
  if (user.level !== userLevel) {
    user.level = userLevel;
    const notification = new Notification({
      recipient: user._id, // Set the recipient to the user's ID
      message: `Congratulations! You have achieved level ${userLevel}.`, // Customize the notification message
      importance: 'high', // Set the importance to 'high' for level-up notifications
    });

    await notification.save();

    const levelHistoryEntry = new LevelHistory({
      userId: user._id, // Set the user's ID
      level: userLevel, // Set the new level achieved
    });

    // Save the level history entry to the database
    await levelHistoryEntry.save();
  }
}

function calculateCoinsEarned(user, lessonCompletion) {
  const earningCoefficient = coinEarningCoefficients[user.level] || 0;
  user.coins = Math.round(earningCoefficient * lessonCompletion);
}

module.exports = {
  // calculateUserLevel,
  assignExperiencePoints,
  calculateCoinsEarned,
};
