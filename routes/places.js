const express = require('express');
const Place = require('../models/place');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const place = new Place({
    placeName: req.body.placeName,
    address: req.body.address,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  });
  try {
    const newPlace = await place.save();
    res.status(201).json(newPlace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/', (req, res) => {});

router.delete('/', (req, res) => {});

module.exports = router;
