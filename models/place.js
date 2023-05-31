const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema(
  {
    placeName: String,
    address: String,
    detailAddress: String,
    latitude: String,
    longitude: String,
  },
  {
    versionKey: false,
  }
);

const Place = mongoose.model('places', placeSchema);

module.exports = Place;
