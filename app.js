const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewroutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
//Servinf static files
app.use(express.static(path.join(__dirname, 'public')));
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

//DATA SANITIZATION AGAINST NOSQL QUERY INJECTION
app.use(mongoSanitize());

//DATA SANITIZATION AGAINST XSS
app.use(xss());

//PARAMETER POLLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'difficulty',
      'ratingsAverage',
      'maxGroupSize',
      'price'
    ]
  })
);

//SERVING STATIC FILES
// app.use(express.static(`${__dirname}/public`));

//TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

// 3) ROUTES
app.get('/', (req, res) => {
  res.status(200).render('base', {
    tour: 'The forest hiker',
    user: 'Jonas'
  });
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on this path`, '404'));
});

/////////////////////////////////////
// ALL HANDLER OF ERROR
/////////////////////////////////////
app.use(globalErrorHandler);

module.exports = app;
