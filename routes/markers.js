const express = require('express');
const Marker = require('../models/marker');
const router = express.Router();

/** ⚙️ [markers] collection에 대한 Model definition
 * @swagger
 * definitions:
 *   Marker:
 *     type: object
 *     required:
 *       - _id
 *       - latitude
 *       - longitude
 *     properties:
 *       _id:
 *         type: string
 *         description: Marker's ID
 *       latitude:
 *         type: string
 *         description: Latitude of the marker
 *       longitude:
 *         type: string
 *         description: Longitude of the marker
 */

/**
 * @swagger
 * /api/markers:
 *   get:
 *     tags:
 *       - Marker API
 *     summary: Returns a list of markers ➜ [In-App use ❌]
 *     description: |
 *       🇺🇸: This API fetches a list of markers from [markers] collection.
 *
 *       🇰🇷: 이 API는 [markers] collection 내의 마커 목록을 가져옵니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Marker'
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req, res) => {
  try {
    const markers = await Marker.find();
    if (!markers) {
      return res.status(404).json({ message: err.message });
    }

    res.status(200).json(markers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
