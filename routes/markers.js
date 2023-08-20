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

/**
 * @swagger
 * /api/markers:
 *   get:
 *     tags:
 *       - Markers Collection 기반 API
 *     summary: (markers) Collection 내의 모든 Document(s) 반환 ➜ [In-App use ❌]
 *     description: (markers) collection 내의 모든 데이터 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Marker'
 *       404:
 *         description: Not Found
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Not Found"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.get('/', async (req, res) => {
  try {
    const markers = await Marker.find();
    if (!markers) {
      return res.status(404).json({ error: 'Not Found' });
    }

    return res.status(200).json(markers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
