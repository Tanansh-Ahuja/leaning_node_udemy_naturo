const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: '404 Not Found',
  //   message: 'No routes found'
  // });
  // const err = new Error(`cant find ${req.originalUrl} on this path`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`cant find ${req.originalUrl} on this path`, '404'));
});

/////////////////////////////////////
// ALL HANDLER OF ERROR
/////////////////////////////////////
app.use(globalErrorHandler);

module.exports = app;
