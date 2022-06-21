const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    //validator
    //strings pe match bhi ek validator hai
    name: {
      type: String,
      required: [true, 'tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have 40 characters'],
      minLength: [10, 'A tour name must have 10 characters']
      // validate: [validator.isAlpha, 'Tourname must only have charaters']
    },
    slug: { type: String },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficulty'],
        message: 'Diffuclty level wrong,'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.7,
      min: [1, 'Rating must be 1 or more'],
      max: [5, 'Rating must be greater than or equal to 5']
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //this will not run on update
          // this keyword only work on new documents
          return val < this.price; //100<200 true // 250<200 false
        },
        message: `Pricediscount must be between 0 and ${this.price}`
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover']
    },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    secretTour: { type: Boolean, default: false }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//MIDDLEWARES
//DOCUMENT MIDDLEWARES: run before .save() and .create(), not .update()
tourSchema.pre('save', function(next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('will save document');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   // this.slug = slugify(this.name, { lower: true });
//   next();
// });

// QUERY MIDDLEWARE
////////////////////////////////
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
// tourSchema.pre('find', function(next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });
// tourSchema.pre('findOne', function(next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

////////////////////////////////////////////////////////////////
//AGGREGATION MIDDLEWARE
////////////////////////////////////////////////////////////////

tourSchema.pre('aggregate', function(next) {
  console.log(this.pipleline);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
