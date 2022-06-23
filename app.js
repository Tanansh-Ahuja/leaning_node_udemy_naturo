const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
//SET SECURITY HTTP HEADERS
app.use(helmet());

//LIMIT REQUEST FROM SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hr
  message: 'To many requests from this IP, Please try again in an hour'
});
app.use('/api', limiter);

//DEVELOPMENT LOGGING OF API CALLS
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// BODY-PARSER, READING DATA FROM BODY INTO REQ.BODY
app.use(express.json({ limit: '10kb' }));

//SERVING STATIC FILES
app.use(express.static(`${__dirname}/public`));

//TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on this path`, '404'));
});

/////////////////////////////////////
// ALL HANDLER OF ERROR
/////////////////////////////////////
app.use(globalErrorHandler);

module.exports = app;
