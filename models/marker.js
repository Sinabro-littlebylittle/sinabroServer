const mongoose = require('mongoose');

const markerSchema = new mongoose.Schema(
  {
    latitude: String,
    longitude: String,
  },
  {
    versionKey: false,
  }
);

const Place = mongoose.model('markers', markerSchema);

module.exports = Place;
