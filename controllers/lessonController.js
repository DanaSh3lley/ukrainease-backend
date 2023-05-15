const Lesson = require('../models/lessonModel');
const factory = require('./handlerFactory');
const LessonProgress = require('../models/lessonProgressModel');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const QuestionProgress = require('../models/questionProgressModel');
const Question = require('../models/questionModel');

function getRandomIndexes(total, count) {
  const indexes = new Set();
  while (indexes.size < count) {
    const randomIndex = Math.floor(Math.random() * total);
    indexes.add(randomIndex);
  }
  return Array.from(indexes);
}

function validateUserAnswer(userAnswer, question) {
  const { type, options } = question;

  switch (type) {
    case 'singleChoice': {
      const correctOption = options.find((option) => option.isCorrect);
      return userAnswer === correctOption.text;
    }

    case 'multipleChoice': {
      const correctOptions = options.filter((option) => option.isCorrect);
      return correctOptions.every((option) => userAnswer.includes(option.text));
    }
    case 'trueFalse': {
      const correctOption = options.find((option) => option.isCorrect);
      return userAnswer === correctOption.text;
    }
    case 'fillBlank': {
      const correctAnswers = options.map((option) => option.text.toLowerCase());
      return correctAnswers.some((correctAnswer) =>
        userAnswer.toLowerCase().includes(correctAnswer)
      );
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

  const requiredCoins = lesson.baseCoins * 4;

  if (user.coins < requiredCoins) {
    return next(new AppError('Not enough coins to start the lesson', 400));
  }

  const allQuestions = lesson.questions;
  const randomIndexes = getRandomIndexes(allQuestions.length, 20);
  const sessionQuestions = randomIndexes.map(
    (index) => allQuestions[index]._id
  );

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

  const isCorrect = validateUserAnswer(userAnswer, question);

  const questionProgress = await QuestionProgress.findOneAndUpdate(
    { user: req.user.id, question: question._id },
    {
      unshift: {
        attempts: {
          userAnswer,
          isCorrect,
          timestamp: Date.now(),
          percentageCorrect: isCorrect ? 100 : 0,
          coinsEarned: isCorrect ? 10 : 0,
          experiencePointsEarned: isCorrect ? 20 : 0,
        },
      },
      nextReview: new Date(2023, 5, 17),
      status: 'completed',
    },
    { upsert: true, new: true }
  );

  lessonProgress.currentQuestion += 1;

  await Promise.all([questionProgress.save(), lessonProgress.save()]);

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
    const lesson = await Lesson.findById(lessonId);
    const allQuestions = lesson.questions;
    const randomIndexes = getRandomIndexes(allQuestions.length, 20);
    sessionQuestions = randomIndexes.map((index) => allQuestions[index]._id);
    lessonProgress.status = 'inProgress';
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
  user.coins += totalCoinsEarned;
  user.experience += totalExperienceEarned;
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
