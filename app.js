const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const path = require('path');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRoutes');
const awardRouter = require('./routes/awardRoutes');
const typeRouter = require('./routes/typeRoutes');
const questionRouter = require('./routes/questionRoutes');
const lessonRouter = require('./routes/lessonRoutes');
const groupRouter = require('./routes/groupRoutes');
const leagueRouter = require('./routes/leagueRoutes');

const app = express();

app.use(cors());
app.options('*', cors());

app.use(helmet());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());

app.use(hpp({ whitelist: [] }));

app.use(compression());

// 3) ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/awards', awardRouter);
app.use('/api/v1/types', typeRouter);
app.use('/api/v1/questions', questionRouter);
app.use('/api/v1/lessons', lessonRouter);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/leagues', leagueRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
