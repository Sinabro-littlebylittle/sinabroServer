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

const placeRouter = require('./routes/places');
app.use('/places', placeRouter);

app.listen(port, () => {
  console.log('Server Started');
});
