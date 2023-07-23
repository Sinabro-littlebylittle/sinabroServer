const mongoose = require('mongoose');

const markerSchema = new mongoose.Schema({
  latitude: String,
  longitude: String,
});

const Marker = mongoose.model('markers', markerSchema);

module.exports = Marker;
