const Lesson = require('../models/lessonModel');
const factory = require('./handlerFactory');
const LessonProgress = require('../models/lessonProgressModel');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const QuestionProgress = require('../models/questionProgressModel');
const Question = require('../models/questionModel');
const {
  assignExperiencePoints,
  calculateCoinsEarned,
} = require('../utils/levelService');

const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const createSessionQuestions = async (
  userId,
  lessonId,
  desiredQuestionCount
) => {
  // Retrieve the lesson
  const lesson = await Lesson.findById(lessonId);

  // Retrieve the user's question progress records for the lesson
  const questionProgressRecords = await QuestionProgress.find({
    user: userId,
    question: { $in: lesson.questions },
  });

  // Filter the question progress records based on status and nextReview
  const errorQuestions = questionProgressRecords
    .filter((record) => record.status === 'error')
    .map((el) => el.question);
  const reviewQuestions = questionProgressRecords
    .filter((record) => new Date(record.nextReview) < new Date())
    .map((el) => el.question);

  // Get the new questions directly from the lesson
  const newQuestions = lesson.questions.filter(
    (question) =>
      !questionProgressRecords.some((record) =>
        record.question.equals(question)
      )
  );

  // Randomize the order of the filtered questions
  const shuffledQuestions = [
    ...shuffleArray(errorQuestions),
    ...shuffleArray(reviewQuestions),
    ...shuffleArray(newQuestions),
  ];

  // Select a subset of questions for the session
  return shuffledQuestions
    .slice(0, desiredQuestionCount)
    .map((question) => question.toString());
};

function checkLessonAccess(user, lesson) {
  const userLevel = user.level;
  const requiredLevel = lesson.requiredLevel || 0;
  console.log(userLevel, requiredLevel);

  if (userLevel >= requiredLevel) {
    return true; // User meets the level requirement
  }
  return false; // User does not meet the level requirement
}

const calculateNextReview = (questionProgress, correctAnswer, modifier = 1) => {
  const { repetitionNumber, ease, nextReview, interval } = questionProgress;

  let newInterval;
  let newEase = ease;

  if (repetitionNumber === 0) {
    newInterval = 1;
  } else {
    newInterval = Math.ceil(interval * newEase * modifier);
  }

  // Calculate the new next review date
  const currentDate = new Date();
  const nextReviewDate = nextReview ? new Date(nextReview) : currentDate;

  // Adjust repetition number and ease based on correct/incorrect answer
  if (correctAnswer) {
    newEase += 0.2; // Increase the ease factor for correct answers
    questionProgress.repetitionNumber += 1;
    questionProgress.status = 'review'; // Set status to 'review' for correct answers
  } else {
    newEase -= 0.2; // Decrease the ease factor for incorrect answers
    questionProgress.repetitionNumber = 0; // Reset repetition number for incorrect answers
    questionProgress.status = 'error'; // Set status to 'new' for incorrect answers
    newInterval = 0; // Set interval to 0 for incorrect answers (review on the next day)
  }

  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  // Determine status based on the calculated interval
  if (newInterval > 21) {
    questionProgress.status = 'mastered'; // Set status to 'mastered' for intervals longer than 7 days
  } else if (newInterval > 1) {
    questionProgress.status = 'review'; // Set status to 'review' for intervals longer than 1 day
  }

  // Clamp the new ease factor between a minimum and maximum value
  const minimumEaseFactor = 1.3;
  const maximumEaseFactor = 4;

  if (newEase < minimumEaseFactor) {
    newEase = minimumEaseFactor;
  } else if (newEase > maximumEaseFactor) {
    newEase = maximumEaseFactor;
  }
  questionProgress.ease = newEase;
  questionProgress.interval = newInterval;
  questionProgress.nextReview = nextReviewDate;

  return questionProgress;
};

const setNextReviewDateForLessonProgress = async (userId, lessonId) => {
  // Find all the question progress records for the lesson and the user
  const questionProgressRecords = await QuestionProgress.find({
    user: userId,
    question: { $in: lessonId.questions }, // Retrieve question IDs associated with the lesson
  });

  // Get the smallest date value among the question progress records
  const nextReviewDate = questionProgressRecords.reduce((minDate, record) => {
    const recordDate = new Date(record.nextReview);
    return recordDate < minDate ? recordDate : minDate;
  }, Infinity);

  // Find the lesson progress for the user and lesson
  const lessonProgress = await LessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

  // Set the next review date for the lesson progress
  lessonProgress.nextReview = nextReviewDate;
  await lessonProgress.save();
};

function validateUserAnswer(userAnswer, question) {
  const { type /*options*/ } = question;

  switch (type) {
    case 'singleChoice': {
      // const correctOption = options.find((option) => option.isCorrect);
      // return userAnswer === correctOption.text;
      return true;
    }

    case 'multipleChoice': {
      // const correctOptions = options.filter((option) => option.isCorrect);
      // return correctOptions.every((option) => userAnswer.includes(option.text));
      return true;
    }
    case 'trueFalse': {
      // const correctOption = options.find((option) => option.isCorrect);
      // return userAnswer === correctOption.text;
      return true;
    }
    case 'fillBlank': {
      // const correctAnswers = options.map((option) => option.text.toLowerCase());
      // return correctAnswers.some((correctAnswer) =>
      //   userAnswer.toLowerCase().includes(correctAnswer)
      // );
      return true;
    }

    case 'shortAnswer': {
      return true;
    }

    case 'matching': {
      return true;
    }

    case 'card': {
      return true;
    }

    default: {
      return false;
    }
  }
}

const getLessonsForUser = async (req, res) => {
  const { id } = req.user;
  const lessons = await Lesson.find()
    .populate({
      path: 'progress',
      match: { user: id },
    })
    .lean();

  const response = lessons.map((lesson) => {
    const { status = 'notStarted', opened = false } = lesson.progress || {};
    return {
      ...lesson,
      progress: status,
      opened,
    };
  });

  return res.status(200).json({
    status: 'success',
    data: response,
  });
};

const getLessonByIdForUser = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId } = req.user;

  const lesson = await Lesson.findById(lessonId)
    .populate({
      path: 'progress',
      match: { user: userId },
      select: ['status', 'opened'],
    })
    .lean();

  if (!lesson) {
    return next(new AppError('Lesson not found', 404));
  }
  const { status = 'notStarted', opened = false } = lesson.progress || {};
  const response = {
    ...lesson,
    progress: status,
    opened,
  };

  res.status(200).json({
    status: 'success',
    data: response,
  });
};

const startLesson = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId } = req.user;

  const [user, lesson] = await Promise.all([
    User.findById(userId),
    Lesson.findById(lessonId),
  ]);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!lesson) {
    return next(new AppError('Lesson not found', 404));
  }

  const existingProgress = await LessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

  if (existingProgress) {
    return next(new AppError('User has already started this lesson', 400));
  }

  const isAccessed = checkLessonAccess(user, lesson);
  if (!isAccessed) {
    return next(
      new AppError('For opening this lesson, you need  higher level', 400)
    );
  }

  const requiredCoins = lesson.baseCoins * 4;

  if (user.coins < requiredCoins) {
    return next(new AppError('Not enough coins to start the lesson', 400));
  }
  const sessionQuestions = await createSessionQuestions(userId, lessonId, 20);

  const lessonProgress = await LessonProgress.create({
    user: userId,
    lesson: lessonId,
    status: 'notStarted',
    opened: true,
    currentQuestion: 0,
    sessionQuestions,
  });

  user.coins -= requiredCoins;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: lessonProgress,
  });
};

const submitQuestion = async (req, res, next) => {
  const { lessonId, userAnswer } = req.body;
  const { id: userId } = req.user;

  const lessonProgress = await LessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

  if (!lessonProgress) {
    return next(new AppError('Lesson progress not found', 404));
  }

  if (
    lessonProgress.currentQuestion >= lessonProgress.sessionQuestions.length
  ) {
    return next(new AppError('You answered all questions', 400));
  }

  const questionId =
    lessonProgress.sessionQuestions[lessonProgress.currentQuestion];

  if (!questionId) {
    return next(new AppError('Question ID not found', 404));
  }

  const question = await Question.findById(questionId);
  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  let questionProgress = await QuestionProgress.findOne({
    user: req.user.id,
    question: question._id,
  });

  if (questionProgress && new Date(questionProgress.nextReview) > new Date()) {
    return next(new AppError('Question cannot be updated yet', 400));
  }

  if (!questionProgress) {
    questionProgress = new QuestionProgress({
      user: req.user.id,
      question: question._id,
      repetitionNumber: 0,
      ease: 2.5,
      nextReview: new Date(),
      status: 'new',
      interval: 0,
    });
  }

  const isCorrect = validateUserAnswer(userAnswer, question);
  const updatedQuestionProgress = calculateNextReview(
    questionProgress,
    isCorrect
  );

  // Update the progress record
  updatedQuestionProgress.attempts.unshift({
    userAnswer,
    isCorrect,
    timestamp: Date.now(),
    percentageCorrect: isCorrect ? 100 : 0,
    coinsEarned: isCorrect ? 10 : 0,
    experiencePointsEarned: isCorrect ? 20 : 0,
  });

  lessonProgress.currentQuestion += 1;
  await Promise.all([updatedQuestionProgress.save(), lessonProgress.save()]);

  return res.status(200).json({
    message: isCorrect ? 'Correct answer' : 'Incorrect answer',
    questionProgress,
    lessonProgress,
  });
};

const takeLesson = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId } = req.user;

  const lessonProgress = await LessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

  if (!lessonProgress) {
    return next(new AppError('Lesson progress not found', 404));
  }

  if (!lessonProgress.opened) {
    return next(new AppError('Lesson is not opened yet', 400));
  }

  const { currentQuestion } = lessonProgress;
  let { sessionQuestions } = lessonProgress;

  if (lessonProgress.status === 'completed') {
    lessonProgress.status = 'inProgress';
    sessionQuestions = await createSessionQuestions(userId, lessonId, 20);
    lessonProgress.sessionQuestions = sessionQuestions;
    await lessonProgress.save();
  }

  if (!sessionQuestions[currentQuestion]) {
    return next(new AppError('No more questions available', 400));
  }

  const questionId = sessionQuestions[currentQuestion];
  const question = await Question.findById(questionId);

  res.status(200).json({
    status: 'success',
    data: {
      question,
    },
  });
};

const finishLesson = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId } = req.user;

  const lesson = await Lesson.findById(lessonId);
  const lessonProgress = await LessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

  if (!lesson || !lessonProgress) {
    return next(new AppError('Lesson or lesson progress not found', 404));
  }

  const { sessionQuestions, status, currentQuestion } = lessonProgress;

  const questionProgresses = await QuestionProgress.find({
    user: userId,
    question: { $in: sessionQuestions },
  }).populate('question');

  const totalQuestions = sessionQuestions.length;

  if (totalQuestions === 0) {
    if (lessonProgress.status !== 'completed') {
      lessonProgress.status = 'completed';
      lessonProgress.save();
    }
    return next(new AppError('Good job! Come back tomorrow!', 400));
  }

  if (currentQuestion !== totalQuestions || status === 'completed') {
    return next(
      new AppError(
        'All questions must be answered before finishing the lesson',
        400
      )
    );
  }

  const totalCorrect = questionProgresses.reduce(
    (count, questionProgress) =>
      count + (questionProgress.attempts[0].isCorrect ? 1 : 0),
    0
  );
  const percentageCorrect = (totalCorrect / totalQuestions) * 100;

  const totalCoinsEarned = questionProgresses.reduce(
    (coins, questionProgress) =>
      coins + questionProgress.attempts[0].coinsEarned,
    0
  );

  const totalExperienceEarned = questionProgresses.reduce(
    (experience, questionProgress) =>
      experience + questionProgress.attempts[0].experiencePointsEarned,
    0
  );

  const userAnswers = questionProgresses.map((questionProgress) => ({
    question: questionProgress.question.text,
    userAnswer: questionProgress.attempts[0].userAnswer,
    isCorrect: questionProgress.attempts[0].isCorrect,
  }));

  const user = await User.findById(userId);
  calculateCoinsEarned(user, totalCoinsEarned);
  await assignExperiencePoints(user, totalCoinsEarned);
  await user.save({ validateBeforeSave: false });

  lessonProgress.status = 'completed';
  lessonProgress.sessionQuestions = [];
  lessonProgress.currentQuestion = 0;

  lessonProgress.attempts.unshift({
    timestamp: Date.now(),
    percentageCorrect,
    coinsEarned: totalCoinsEarned,
    experiencePointsEarned: totalExperienceEarned,
  });

  await setNextReviewDateForLessonProgress(userId, lesson);

  await lessonProgress.save();

  return res.status(200).json({
    totalQuestions,
    totalCorrect,
    percentageCorrect,
    totalCoinsEarned,
    totalExperienceEarned,
    userAnswers,
  });
};

module.exports = {
  getLesson: factory.getOne(Lesson),
  getAllLessons: factory.getAll(Lesson),
  createLesson: factory.createOne(Lesson),
  updateLesson: factory.updateOne(Lesson),
  deleteLesson: factory.deleteOne(Lesson),
  getLessonsForUser: catchAsync(getLessonsForUser),
  getLessonByIdForUser: catchAsync(getLessonByIdForUser),
  startLesson: catchAsync(startLesson),
  submitQuestion: catchAsync(submitQuestion),
  takeLesson: catchAsync(takeLesson),
  finishLesson: catchAsync(finishLesson),
};
