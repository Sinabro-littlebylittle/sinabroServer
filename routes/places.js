const express = require('express');
const Place = require('../models/place');
const Headcount = require('../models/headcount');
const mongoose = require('mongoose');
const Marker = require('../models/marker');
const { getFormattedDate } = require('../utils/dateUtils');
const { verifyToken } = require('./middlewares/authorization');
const router = express.Router();

/** ⚙️ [places] collection에 대한 Model definition
 * @swagger
 * definitions:
 *   Place:
 *     type: object
 *     required:
 *       - _id
 *       - placeName
 *       - address
 *       - detailAddress
 *       - markerId
 *       - __v
 *     properties:
 *       _id:
 *         type: string
 *         format: ObjectId
 *         description: placeId
 *       placeName:
 *         type: string
 *         description: 장소명
 *       address:
 *         type: string
 *         description: 장소 주소
 *       detailAddress:
 *         type: string
 *         description: 장소 세부 주소
 *       markerId:
 *         type: string
 *         format: ObjectId
 *         description: placeId와 연관된 markerId
 *       __v:
 *         type: number
 *         description: version key
 */

// :id값에 따른 document 중 _id값이 :id와 동일한 document 설정 및 조회
const getPlace = async (req, res, next) => {
  const placeId = req.params.id;

  if (!placeId) return res.status(400).json({ error: 'Bad Request' });
  if (!mongoose.Types.ObjectId.isValid(placeId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  try {
    const place = await Place.findById(placeId);
    if (!place) return res.status(404).json({ error: 'Not Found' });

    res.place = place;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/places/private:
 *   post:
 *     tags:
 *       - Places Collection 기반 API
 *     summary: 신규 장소 등록
 *     security:
 *       - JWT: []
 *     description: 새로운 장소를 등록하고 필요한 경우 새로운 마커 정보를 생성하며, (headcounts) collection에 인원수 정보를 추가합니다.
 *     parameters:
 *       - in: body
 *         name: placesRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             placeName:
 *               type: string
 *             address:
 *               type: string
 *             detailAddress:
 *               type: string
 *             latitude:
 *               type: string
 *             longitude:
 *               type: string
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           $ref: '#/definitions/Place'
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Bad Request"
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Unauthorized"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/private', verifyToken, async (req, res) => {
  const { placeName, address, detailAddress, latitude, longitude } = req.body;

  if (!placeName || !address || !detailAddress || !latitude || !longitude)
    return res.status(400).json({ error: 'Bad Request' });

  let markerId;
  let newMarker;

  try {
    const marker = await Marker.findOne({
      latitude,
      longitude,
    });
    if (!marker) {
      newMarker = new Marker(req.body);
      markerId = newMarker.id;
      await newMarker.save();
    } else {
      markerId = marker.id;
    }

    const place = new Place(req.body);
    place.markerId = markerId;

    const newPlace = await place.save();

    const headcount = new Headcount({
      placeId: newPlace._id,
      headcount: -1,
      createdTime: getFormattedDate(),
    });

    const newHeadcount = await headcount.save();
    return res.status(201).json(newPlace);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/places/private/places/{placeId}:
 *   put:
 *     tags:
 *       - Places Collection 기반 API
 *     summary: 장소 정보 수정
 *     security:
 *       - JWT: []
 *     description: 특정 장소를 새로운 정보로 수정합니다.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         description: placeId
 *         type: string
 *       - in: body
 *         name: placeRequest
 *         required: true
 *         description: placeRequest
 *         schema:
 *           type: object
 *           required:
 *             - placeName
 *             - detailAddress
 *           properties:
 *             placeName:
 *               type: string
 *             detailAddress:
 *               type: string
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           $ref: '#/definitions/Place'
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             errror:
 *               type: string
 *               example: "Bad Request"
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Unauthorized"
 *       415:
 *         description: Unsupported Media Type
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Unsupported Media Type"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.put('/private/places/:id', verifyToken, getPlace, async (req, res) => {
  const { placeName, detailAddress } = req.body;
  if (!placeName || !detailAddress)
    return res.status(400).json({ error: 'Bad Request' });

  res.place.placeName = placeName;
  res.place.detailAddress = detailAddress;

  try {
    const updatedPlace = await res.place.save();
    return res.status(200).json(updatedPlace);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/places/private/places/{placeId}:
 *   delete:
 *     tags:
 *       - Places Collection 기반 API
 *     summary: 특정 장소 정보 제거
 *     security:
 *       - JWT: []
 *     description: 특정 장소에 대한 데이터를 제거합니다.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         description: placeId
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *            remainingPlacesCnt:
 *              type: number
 *              example: "0"
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Bad Request"
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Unauthorized"
 *       415:
 *         description: Unsupported Media Type
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Unsupported Media Type"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.delete(
  '/private/places/:id',
  verifyToken,
  getPlace,
  async (req, res) => {
    try {
      const places = await Place.find({
        markerId: res.place.markerId,
      });
      // 삭제하려는 장소 위치(위도, 경도)에 등록된 장소가 한 곳 일 때 마커 데이터도 함께 제거
      if (places.length === 1) {
        // markers collection 내 삭제하려는 장소의 _id값을 지닌 연관 document 제거
        await Marker.deleteOne({ _id: res.place.markerId });
      }

      // (headcounts) collection 내 삭제하려는 장소의 _id값을 지닌 연관 document(들) 일괄 제거
      await Headcount.deleteMany({ placeId: res.place._id });
      await res.place.deleteOne();
      return res.status(200).json({ remainingPlacesCnt: places.length - 1 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
