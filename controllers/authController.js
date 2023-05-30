const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const Group = require('../models/groupModel');
const League = require('../models/leagueModel');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  FRONTEND_URL,
  JWT_COOKIE_EXPIRES_IN,
} = require('../config');

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const setTokenCookie = (res, token, req) => {
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  setTokenCookie(res, token, req);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const findGroupWithLessThanTenUsers = (league) =>
  league.groups.find((group) => group.users.length < 10);

const createNewGroup = async (league) => {
  const groupCount = league.groups.length;

  const newGroup = await Group.create({
    name: `${league.name}-group-${groupCount + 1}`,
    users: [],
  });

  league.groups.push(newGroup);
  await league.save();

  return newGroup;
};

const sendWelcomeEmail = async (user, req) => {
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcome();
};

exports.signup = catchAsync(async (req, res, next) => {
  const league = await League.findOne({ level: 1 }).populate('groups');

  let firstGroup = findGroupWithLessThanTenUsers(league);

  if (!firstGroup) {
    firstGroup = await createNewGroup(league);
  }

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    league: league._id,
  });

  firstGroup.users.push(newUser._id);
  await firstGroup.save();

  await sendWelcomeEmail(newUser, req);

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

const extractTokenFromRequest = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies.jwt) {
    return req.cookies.jwt;
  }

  return null;
};

const verifyToken = async (token) =>
  promisify(jwt.verify)(token, process.env.JWT_SECRET);

exports.protect = catchAsync(async (req, res, next) => {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  const decoded = await verifyToken(token);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await verifyToken(req.cookies.jwt);

      const currentUser = await User.findById(decoded.id);
      if (!currentUser || currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };

const createEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const expires = Date.now() + 10 * 60 * 1000;

  return {
    token,
    hashedToken,
    expires,
  };
};

exports.sendVerification = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const { token, hashedToken, expires } = createEmailVerificationToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expires;

  const url = `${FRONTEND_URL}/verify-email/${token}`;

  try {
    await new Email(user).sendEmailVerification(url);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Please try again later!',
        500
      )
    );
  }
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const url = `${FRONTEND_URL}/reset/${resetToken}`;
    await new Email(user, url).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = hashToken(req.params.token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save({ validateBeforeSave: false });

  const { _id, name, email } = user;

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        _id,
        name,
        email,
      },
    },
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = hashToken(req.params.token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 403));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendToken(user, 200, req, res);
});
