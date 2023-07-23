const express = require('express');
const Place = require('../models/place');
const PeopleNumber = require('../models/people_number');
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
 *       - markerId
 *       - placeName
 *       - address
 *       - detailAddress
 *     properties:
 *       _id:
 *         type: string
 *         description: Place's ID
 *       markerId:
 *         type: string
 *         description: The marker ID related to the place
 *       placeName:
 *         type: string
 *         description: The name of the place
 *       address:
 *         type: string
 *         description: The address of the place
 *       detailAddress:
 *         type: string
 *         description: The detailed address of the place
 */

// :id값에 따른 document 중 _id값이 :id와 동일한 document 설정 및 조회
const getPlace = async (req, res, next) => {
  let place;
  try {
    place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: err.message });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.place = place;
  next();
};

/**
 * @swagger
 * /api/places:
 *   get:
 *     tags:
 *       - Place API
 *     summary: Returns a list of places ➜ [In-App use ❌]
 *     description: |
 *       🇺🇸: This API fetches a list of places from [places] collection
 *
 *       🇰🇷: 이 API는 [places] collection 내의 장소 목록을 가져옵니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Place'
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req, res) => {
  try {
    const places = await Place.find();
    if (!places) {
      res.status(404).json({ message: err.message });
      return;
    }
    res.json(places);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/places:
 *   post:
 *     tags:
 *       - Place API
 *     summary: Register a new place
 *     description: |
 *       🇺🇸: This API registers a new place in the [places] collection and  records number of people in the [people_numbers] collections, creating a new marker information if necessary.
 *
 *       🇰🇷: 이 API는 필요한 경우 새로운 마커 정보를 생성하며, [places] collection에 새로운 장소를 등록하고, [people_numbers] collection에 사람 수를 기록합니다.
 *     parameters:
 *       - in: body
 *         name: placesRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             placeName:
 *               type: string
 *               description: Name of the place
 *             address:
 *               type: string
 *               description: Address of the place
 *             detailAddress:
 *               type: string
 *               description: Detailed address of the place
 *             latitude:
 *               type: number
 *               format: float
 *               description: Latitude of the place
 *             longitude:
 *               type: number
 *               format: float
 *               description: Longitude of the place
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           properties:
 *             newMarker:
 *               properties:
 *                 latitude:
 *                   type: string
 *                 longitude:
 *                   type: string
 *                 _id:
 *                   type: string
 *             newPlace:
 *               properties:
 *                 markerId:
 *                   type: string
 *                 placeName:
 *                   type: string
 *                 address:
 *                   type: string
 *                 detailAddress:
 *                   type: string
 *                 _id:
 *                   type: string
 *             newPeopleNumber:
 *               properties:
 *                 placeId:
 *                   type: string
 *                 peopleCount:
 *                   type: integer
 *                 createdTime:
 *                   type: string
 *                 _id:
 *                   type: string
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.post('/private', verifyToken, async (req, res) => {
  if (
    !req.body.placeName ||
    !req.body.address ||
    !req.body.detailAddress ||
    !req.body.latitude ||
    !req.body.longitude
  ) {
    return res.status(400).json({ message: err.message });
  }

  let markerId;
  let newMarker;

  try {
    marker = await Marker.findOne({
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    if (!marker) {
      newMarker = new Marker(req.body);
      markerId = newMarker.id;
      try {
        await newMarker.save();
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    } else {
      markerId = marker.id;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  try {
    const place = new Place(req.body);
    place.markerId = markerId;

    const newPlace = await place.save();

    const peopleNumber = new PeopleNumber({
      placeId: newPlace._id,
      peopleCount: -1,
      createdTime: getFormattedDate(),
    });

    const newPeopleNumber = await peopleNumber.save();
    res.status(201).json(newPlace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/places/{placeId}:
 *   patch:
 *     tags:
 *       - Place API
 *     summary: Update a specific place
 *     description: |
 *       🇺🇸: This API updates a specific place with new information.
 *
 *       🇰🇷: 이 API는 특정 장소를 새로운 정보로 업데이트 합니다.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         description: placeId
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
 *       201:
 *         description: Created
 *         schema:
 *           $ref: '#/definitions/Place'
 *       400:
 *         description: Bad Request
 */
router.patch('/private/:id', getPlace, verifyToken, async (req, res) => {
  if (req.body.placeName != null) res.place.placeName = req.body.placeName;
  if (req.body.detailAddress != null)
    res.place.detailAddress = req.body.detailAddress;
  try {
    const updatedPlace = await res.place.save();
    res.status(201).json(updatedPlace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/places/{placeId}:
 *   delete:
 *     tags:
 *       - Place API
 *     summary: Delete a specific place
 *     description: |
 *       🇺🇸: This API deletes a specific place.
 *
 *       🇰🇷: 이 API는 특정 장소에 대한 데이터를 제거합니다.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         description: placeId
 *     responses:
 *       '200':
 *         description: Created
 *         schema:
 *           type: integer
 *       500:
 *         description: Internal Server Error
 */
router.delete('/private/:id', getPlace, verifyToken, async (req, res) => {
  let places;
  try {
    places = await Place.find({
      markerId: res.place.markerId,
    });
    // 삭제하려는 장소 위치(위도, 경도)에 등록된 장소가 한 곳 일 때 마커 데이터도 함께 제거
    if (places.length === 1) {
      try {
        // markers collection 내 삭제하려는 장소의 _id값을 지닌 연관 document 제거
        await Marker.deleteOne({ _id: res.place.markerId });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  try {
    // people_numbers collection 내 삭제하려는 장소의 _id값을 지닌 연관 document(들) 일괄 제거
    await PeopleNumber.deleteMany({ placeId: res.place._id });
    await res.place.deleteOne();
    res.status(200).json(places.length - 1);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
