const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  let newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Please use signup Route'
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = async (req, res, next) => {
  //1. Create error if user POSTs password Data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new appError('this route is not for password update'), 400);
  }

  //2. Update user document
  const filterBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ status: 'success', updatedUser });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res
    .status(204)
    .json({ status: 'success', message: 'User deleted successfully' });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//DP NOT UPDATE PASSWORDS
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
