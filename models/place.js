const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema(
  {
    placeName: String,
    address: String,
    latitude: String,
    longitude: String,
  },
  {
    versionKey: false,
  }
);

const Place = mongoose.model('Place', PlaceSchema);

module.exports = Place;
