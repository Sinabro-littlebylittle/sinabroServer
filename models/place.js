const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const placeSchema = new mongoose.Schema(
  {
    markerId: { type: Schema.Types.ObjectId, ref: 'markers' },
    placeName: String,
    address: String,
    detailAddress: String,
  },
  {
    versionKey: false,
  }
);

const Place = mongoose.model('places', placeSchema);

module.exports = Place;
