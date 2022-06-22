const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const signToken = id => {
  return jwt.sign(
    {
      id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });
  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'successul save',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. If email exists
  if (!email || !password) {
    return next(new appError(`please give email id and password!`, 400));
  }

  //2. if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Incorrect email or password', 401));
  }
  //3. rest all is okay send the jwt back to client
  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1. Get the token and check if its there or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  //   console.log(token);
  if (token === undefined) {
    return next(new appError('You are not logged in', 401));
  }

  //2. validate the token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   console.log(decode);
  //3. check if user still exists
  const freshUser = await User.findById(decode.id);
  if (!freshUser) {
    return next(new appError('User no longer exist', 401));
  }

  //4. check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decode.iat)) {
    next(
      new appError('user recently changed password, please login again', 401)
    );
  }
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(new appError(`dont have permission for this action`, 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('There is no user with that mail id', 404));
  }

  //2. GENERATE RANDOM TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save();
});
