const Lesson = require('../models/lessonModel');
const factory = require('./handlerFactory');
const LessonProgress = require('../models/lessonProgressModel');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const QuestionProgress = require('../models/questionProgressModel');
const Question = require('../models/questionModel');
const { assignEarnings, increaseCoins } = require('../utils/levelService');
const {
  incrementUserProgress,
  checkAwardAchievement,
} = require('../utils/progressTracker');
const Award = require('../models/awardModel');
const CriteriaTypes = require('../utils/criteriaTypes');
const { shuffleArray } = require('./leagueController');

const getQuestionProgressRecords = async (userId, questions) =>
  await QuestionProgress.find({ user: userId, question: { $in: questions } });
const findQuestionProgressRecords = async (userId, lesson) =>
  QuestionProgress.find({
    user: userId,
    question: { $in: lesson.questions },
  });
const getQuestionProgresses = async (userId, sessionQuestions) =>
  QuestionProgress.find({
    user: userId,
    question: { $in: sessionQuestions },
  }).populate('question');

const getQuestionsWithStatus = (questionProgressRecords, status) =>
  questionProgressRecords
    .filter((record) => record.status === status)
    .map((record) => record.question);

const getQuestionsForReview = (questionProgressRecords) => {
  const currentDate = new Date();
  return questionProgressRecords
    .filter((record) => new Date(record.nextReview) < currentDate)
    .map((record) => record.question);
};

const getNewQuestions = (allQuestions, questionProgressRecords) =>
  allQuestions.filter(
    (question) =>
      !questionProgressRecords.some((record) =>
        record.question.equals(question)
      )
  );

const shuffleQuestions = (questionArrays) => {
  const shuffledQuestions = questionArrays.flatMap((questions) =>
    shuffleArray(questions)
  );
  return [...new Set(shuffledQuestions)];
};

const selectQuestionsForSession = (questions, count) =>
  questions.slice(0, count);

const createSessionQuestions = async (
  userId,
  lessonId,
  desiredQuestionCount
) => {
  const lesson = await Lesson.findById(lessonId);
  const questionProgressRecords = await getQuestionProgressRecords(
    userId,
    lesson.questions
  );
  const errorQuestions = getQuestionsWithStatus(
    questionProgressRecords,
    'error'
  );
  const reviewQuestions = getQuestionsForReview(questionProgressRecords);
  const newQuestions = getNewQuestions(
    lesson.questions,
    questionProgressRecords
  );
  const shuffledQuestions = shuffleQuestions([
    errorQuestions,
    reviewQuestions,
    newQuestions,
  ]);
  const sessionQuestions = selectQuestionsForSession(
    shuffledQuestions,
    desiredQuestionCount
  );

  return sessionQuestions.map((question) => question.toString());
};

function checkLessonAccess(user, lesson) {
  const userLevel = user.level;
  const requiredLevel = lesson.requiredLevel || 0;

  return userLevel >= requiredLevel;
}

const calculateInitialInterval = () => 1;

const calculateNewInterval = (interval, ease, modifier) =>
  Math.ceil(interval * ease * modifier);

const calculateNextReviewDate = (nextReview) => {
  const currentDate = new Date();
  return nextReview ? new Date(nextReview) : currentDate;
};

const increaseEaseFactor = (questionProgress) => {
  questionProgress.ease += 0.2;
};

const incrementRepetitionNumber = (questionProgress) => {
  questionProgress.repetitionNumber += 1;
};

const setStatusToReview = (questionProgress) => {
  questionProgress.status = 'review';
};

const decreaseEaseFactor = (questionProgress) => {
  questionProgress.ease -= 0.2;
};

const resetRepetitionNumber = (questionProgress) => {
  questionProgress.repetitionNumber = 0;
};

const setStatusToError = (questionProgress) => {
  questionProgress.status = 'error';
};

const determineStatus = (newInterval, questionProgress) => {
  if (newInterval > 21) {
    questionProgress.status = 'mastered';
  } else if (newInterval > 1) {
    questionProgress.status = 'review';
  }
};

const clampEaseFactor = (questionProgress) => {
  const minimumEaseFactor = 1.3;
  const maximumEaseFactor = 4;

  if (questionProgress.ease < minimumEaseFactor) {
    questionProgress.ease = minimumEaseFactor;
  } else if (questionProgress.ease > maximumEaseFactor) {
    questionProgress.ease = maximumEaseFactor;
  }
};

const updateProgress = (
  correctAnswer,
  newInterval,
  nextReviewDate,
  questionProgress
) => {
  if (correctAnswer) {
    increaseEaseFactor(questionProgress);
    incrementRepetitionNumber(questionProgress);
    setStatusToReview(questionProgress);
  } else {
    decreaseEaseFactor(questionProgress);
    resetRepetitionNumber(questionProgress);
    setStatusToError(questionProgress);
    newInterval = 0;
  }

  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  determineStatus(newInterval, questionProgress);

  clampEaseFactor(questionProgress);

  questionProgress.interval = newInterval;
  questionProgress.nextReview = nextReviewDate;
};

const calculateNextReview = (questionProgress, correctAnswer, modifier = 1) => {
  const { repetitionNumber, ease, nextReview, interval } = questionProgress;

  let newInterval;

  if (repetitionNumber === 0) {
    newInterval = calculateInitialInterval();
  } else {
    newInterval = calculateNewInterval(interval, ease, modifier);
  }

  const nextReviewDate = calculateNextReviewDate(nextReview);

  updateProgress(correctAnswer, newInterval, nextReviewDate, questionProgress);

  return questionProgress;
};

const calculateNextLessonReviewDate = (questionProgressRecords) =>
  questionProgressRecords.reduce((minDate, record) => {
    const recordDate = new Date(record.nextReview);
    return recordDate < minDate ? recordDate : minDate;
  }, Infinity);

const findLessonProgress = async (userId, lessonId) =>
  await LessonProgress.findOne({
    user: userId,
    lesson: lessonId,
  });

const updateNextReviewDate = (nextReviewDate, lessonProgress) => {
  lessonProgress.nextReview = nextReviewDate;
};

const saveLessonProgress = async (lessonProgress) => {
  await lessonProgress.save();
};

const setNextReviewDateForLessonProgress = async (userId, lesson) => {
  const questionProgressRecords = await findQuestionProgressRecords(
    userId,
    lesson
  );

  const nextReviewDate = calculateNextLessonReviewDate(questionProgressRecords);

  const lessonProgress = await findLessonProgress(userId, lesson._id);

  updateNextReviewDate(nextReviewDate, lessonProgress);

  await saveLessonProgress(lessonProgress);
};

function validateUserAnswer(userAnswer, question) {
  const { type /*options*/ } = question;

  switch (type) {
    case 'singleChoice': {
      // const correctOption = options.find((option) => option.isCorrect);
      // return userAnswer === correctOption.text;
      return !Math.round(Math.random());
    }

    case 'multipleChoice': {
      // const correctOptions = options.filter((option) => option.isCorrect);
      // return correctOptions.every((option) => userAnswer.includes(option.text));
      return !Math.round(Math.random());
    }
    case 'trueFalse': {
      // const correctOption = options.find((option) => option.isCorrect);
      // return userAnswer === correctOption.text;
      return !Math.round(Math.random());
    }
    case 'fillBlank': {
      // const correctAnswers = options.map((option) => option.text.toLowerCase());
      // return correctAnswers.some((correctAnswer) =>
      //   userAnswer.toLowerCase().includes(correctAnswer)
      // );
      return !Math.round(Math.random());
    }

    case 'shortAnswer': {
      return !Math.round(Math.random());
    }

    case 'matching': {
      return !Math.round(Math.random());
    }

    case 'card': {
      return !Math.round(Math.random());
    }

    default: {
      return false;
    }
  }
}

const getLessonProgress = async (userId) =>
  Lesson.find().populate({
    path: 'progress',
    match: { user: userId },
  });

const mapLessonsResponse = (lesson) => {
  const { status = 'notStarted', opened = false } = lesson.progress || {};
  return {
    ...lesson.toObject(),
    progress: status,
    opened,
  };
};

const mapLessonResponse = (lesson) => {
  const { status = 'notStarted', opened = false } = lesson.progress || {};
  return {
    ...lesson,
    progress: status,
    opened,
  };
};

const getLessonProgressById = async (lessonId, userId) =>
  Lesson.findById(lessonId)
    .populate({
      path: 'progress',
      match: { user: userId },
      select: ['status', 'opened'],
    })
    .lean();

const findUserById = async (userId) => User.findById(userId);

const findLessonById = async (lessonId) => Lesson.findById(lessonId);

const findQuestionById = async (questionId) => Question.findById(questionId);

const findQuestionProgress = async (userId, questionId) =>
  QuestionProgress.findOne({ user: userId, question: questionId });

const validateQuestionProgress = (questionProgress) =>
  questionProgress && new Date(questionProgress.nextReview) > new Date();

const createQuestionProgress = (userId, questionId) =>
  new QuestionProgress({
    user: userId,
    question: questionId,
    repetitionNumber: 0,
    ease: 2.5,
    nextReview: new Date(),
    status: 'new',
    interval: 0,
  });

const updateAttempts = (updatedQuestionProgress, userAnswer, isCorrect) => {
  updatedQuestionProgress.attempts.unshift({
    userAnswer,
    isCorrect,
    timestamp: Date.now(),
    percentageCorrect: isCorrect ? 100 : 0,
    coinsEarned: isCorrect ? 10 : 0,
    experiencePointsEarned: isCorrect ? 20 : 0,
  });
};

const updateLessonProgress = (lessonProgress) => {
  lessonProgress.currentQuestion += 1;
};

const findAwardByType = async (awardType) =>
  Award.findOne({ 'criteria.type': awardType });

const completeLesson = async (lessonProgress) => {
  lessonProgress.status = 'completed';
  await lessonProgress.save();
};

const calculateProgressStats = (questionProgresses, totalQuestions) => {
  let totalCorrect = 0;
  let totalCoinsEarned = 0;
  let totalExperienceEarned = 0;

  const userAnswers = questionProgresses.map((questionProgress) => {
    const { attempts } = questionProgress;
    const { isCorrect } = attempts[0];
    const { coinsEarned } = attempts[0];
    const { experiencePointsEarned } = attempts[0];

    totalCorrect += isCorrect ? 1 : 0;
    totalCoinsEarned += coinsEarned;
    totalExperienceEarned += experiencePointsEarned;

    return {
      question: questionProgress.question.text,
      userAnswer: attempts[0].userAnswer,
      isCorrect,
    };
  });

  const percentageCorrect = (totalCorrect / totalQuestions) * 100;

  return {
    totalCorrect,
    percentageCorrect,
    totalCoinsEarned,
    totalExperienceEarned,
    userAnswers,
  };
};

const lessonProgressToComplete = async (
  lessonProgress,
  totalCoinsEarned,
  totalExperienceEarned,
  percentageCorrect
) => {
  lessonProgress.status = 'completed';
  lessonProgress.sessionQuestions = [];
  lessonProgress.currentQuestion = 0;

  lessonProgress.attempts.unshift({
    timestamp: Date.now(),
    percentageCorrect,
    coinsEarned: totalCoinsEarned,
    experiencePointsEarned: totalExperienceEarned,
  });

  await lessonProgress.save();
};

const getLessonsForUser = async (req, res) => {
  const { id } = req.user;
  const lessons = await getLessonProgress(id);

  const response = lessons.map(mapLessonsResponse);

  return res.status(200).json({
    status: 'success',
    data: response,
  });
};
const getLessonByIdForUser = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId } = req.user;

  const lesson = await getLessonProgressById(lessonId, userId);

  if (!lesson) {
    return next(new AppError('Lesson not found', 404));
  }

  const response = mapLessonResponse(lesson);

  res.status(200).json({
    status: 'success',
    data: response,
  });
};
const startLesson = async (req, res, next) => {
  const { lessonId } = req.params;
  const { id: userId } = req.user;

  const [user, lesson, existingProgress] = await Promise.all([
    findUserById(userId),
    findLessonById(lessonId),
    findLessonProgress(userId, lessonId),
  ]);

  if (!user || !lesson) {
    return next(new AppError('User or lesson not found', 404));
  }

  if (existingProgress) {
    return next(new AppError('User has already started this lesson', 400));
  }

  const isAccessed = checkLessonAccess(user, lesson);
  if (!isAccessed) {
    return next(
      new AppError('For opening this lesson, you need a higher level', 400)
    );
  }

  const requiredCoins = lesson.price;
  if (user.coins < requiredCoins) {
    return next(new AppError('Not enough coins to start the lesson', 400));
  }
  const sessionQuestions = await createSessionQuestions(userId, lessonId, 20);

  const lessonProgress = await LessonProgress.create({
    user: userId,
    lesson: lessonId,
    status: 'inProgress',
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

  const lessonProgress = await findLessonProgress(userId, lessonId);

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

  const question = await findQuestionById(questionId);

  if (!question) {
    return next(new AppError('Question not found', 404));
  }

  let questionProgress = await findQuestionProgress(req.user.id, question._id);

  if (validateQuestionProgress(questionProgress)) {
    return next(new AppError('Question cannot be updated yet', 400));
  }

  if (!questionProgress) {
    questionProgress = createQuestionProgress(req.user.id, question._id);
  }

  const isCorrect = validateUserAnswer(userAnswer, question);
  const updatedQuestionProgress = calculateNextReview(
    questionProgress,
    isCorrect
  );
  updateAttempts(updatedQuestionProgress, userAnswer, isCorrect);

  updateLessonProgress(lessonProgress);

  const award = await findAwardByType(CriteriaTypes.QUESTIONS_ANSWERED);

  if (award) {
    await incrementUserProgress(
      userId,
      award._id,
      CriteriaTypes.QUESTIONS_ANSWERED
    );
    await checkAwardAchievement(
      userId,
      award._id,
      CriteriaTypes.QUESTIONS_ANSWERED
    );
  } else {
    return next(new AppError('Award not found', 404));
  }

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

  if (lessonProgress.status === 'completed') {
    lessonProgress.status = 'inProgress';
    lessonProgress.sessionQuestions = await createSessionQuestions(
      userId,
      lessonId,
      20
    );
    await lessonProgress.save();
  }

  const { currentQuestion, sessionQuestions } = lessonProgress;

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

  const lesson = await findLessonById(lessonId);
  const lessonProgress = await findLessonProgress(userId, lessonId);

  if (!lesson || !lessonProgress) {
    return next(new AppError('Lesson or lesson progress not found', 404));
  }

  const { sessionQuestions, status, currentQuestion } = lessonProgress;

  const questionProgresses = await getQuestionProgresses(
    userId,
    sessionQuestions
  );

  const totalQuestions = sessionQuestions.length;

  if (totalQuestions === 0) {
    if (lessonProgress.status !== 'completed') {
      await completeLesson(lessonProgress);
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

  const {
    totalCorrect,
    percentageCorrect,
    totalCoinsEarned,
    totalExperienceEarned,
    userAnswers,
  } = calculateProgressStats(questionProgresses, totalQuestions);

  const user = await User.findById(userId);

  await assignEarnings(user, totalExperienceEarned);
  increaseCoins(user, totalCoinsEarned);
  await user.save({ validateBeforeSave: false });

  await lessonProgressToComplete(
    lessonProgress,
    totalCoinsEarned,
    totalExperienceEarned,
    percentageCorrect
  );
  await setNextReviewDateForLessonProgress(userId, lesson);

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
