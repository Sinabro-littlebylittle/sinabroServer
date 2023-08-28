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
 *         format: ObjectId
 *         description: markerId
 *       latitude:
 *         type: string
 *         description: 마커의 위도
 *       longitude:
 *         type: string
 *         description: 마커의 경도
 *       __v:
 *         type: number
 *         description: version key
 */

module.exports = router;
