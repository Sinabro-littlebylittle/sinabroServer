require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = 5050;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('sinabro server');
});

app.use(express.json());

// [places] collection에 대한 router 등록
const placeRouter = require('./routes/places');
app.use('/places', placeRouter);

// [people_numbers] collection에 대한 router 등록
const peopleNumberRouter = require('./routes/people_numbers');
app.use('/peopleNumbers', peopleNumberRouter);

app.listen(port, () => {
  console.log('Server Started');
});
