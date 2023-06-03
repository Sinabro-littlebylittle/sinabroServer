const express = require('express');
const Marker = require('../models/marker');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const markers = await Marker.find();
    if (!markers) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.status(200).json(markers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
