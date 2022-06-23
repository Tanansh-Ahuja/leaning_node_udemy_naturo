const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

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

const createSendToken = (user, Statuscode, res) => {
  const token = signToken(user._id);
  const cookieoptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieoptions.secure = true;
  }
  //remove the password from the output
  user.password = undefined;
  res.cookie('jwt', token, cookieoptions);
  res.status(Statuscode).json({
    status: 'successul',
    token,
    data: {
      user
    }
  });
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
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. If email exists
  if (!email || !password) {
    return next(
      new appError(`please give email id and password during sign up!`, 400)
    );
  }

  //2. if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Incorrect email or password', 401));
  }
  //3. rest all is okay send the jwt back to client
  createSendToken(user, 200, res);
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
  await user.save({ validateBeforeSave: false });

  //3. send it back as email
  // sending email from node js
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    const message = `Forgot your password? submit a PATCH request with your new password and passwordconfirm to: ${resetURL}.\n if you didn't forget your password, please ignore this email!`;
    await sendEmail({
      email: user.email,
      subject: `Your Password reset Token is: ${resetURL}( valid for 10 mins)`,
      message
    });
    res.status(201).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new appError('There was and error', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2. IF TOKEN HAS NOT EXPIRED, AND THERE IS USER, SET PASSWORD
  if (!user) {
    return next(new appError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3. UPDATE CHANGEDPASSWORDAT PROPERTY FOR THE USER
  //using middleware

  //4. LOG THE USER IN, SEND JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');
  //2. CHECK IF POSTED PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new appError('Your current password is wrong. Please try again'),
      401
    );
  }

  //3. IF SO, UPDATE THE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4. LOG USER IN, send JWT
  createSendToken(user, 200, res);
});
