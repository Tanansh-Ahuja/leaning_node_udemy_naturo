const express = require('express');

//user defined
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const Review = require('../models/reviewModel');
// const ReviewController = require('./../controllers/reviewController');
const reviewRouter = require('../routes/reviewroutes');

//DECLARE ROUTER
const router = express.Router();
// router.param('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
//tours-within?distance=233&center=-40,45&unit=miles
//tours-within/233/center/-40,45/unit/miles
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'user'),
    tourController.getTour
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
