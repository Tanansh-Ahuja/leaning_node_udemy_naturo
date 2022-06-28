const Tour = require('../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get Tour data
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});
exports.getTour = catchAsync(async (req, res) => {
  //1. get the data, for the requested tour
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  res.status(200).render('tour', {
    tour
  });
});
