const fs = require('fs');
const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// dotenv.config({ path: './config.env' });
// const app = require('./app');
const Tour = require('./../../models/tourModel');

const DB = `mongodb+srv://tanansh_ahuja_naturo:tanansh_mongo@cluster0.dolyhay.mongodb.net/naturo?retryWrites=true&w=majority`;
// console.log(DB);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => {
    console.log('DB connection successfull');
  });

//Read file

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

//Import data to database

const importdata = async () => {
  try {
    await Tour.create(tours);
    console.log('data succefully entered');
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit(0);
  }
};

//delete all data from collection
const deletedata = async () => {
  try {
    await Tour.deleteMany();
    console.log('data succefully deleted');
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit(0);
  }
};

if (process.argv[2] === '--import') {
  importdata();
} else if (process.argv[2] == '--delete') {
  deletedata();
}

console.log(process.argv);
