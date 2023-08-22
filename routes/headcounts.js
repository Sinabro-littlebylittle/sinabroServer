const express = require('express');
const mongoose = require('mongoose');
const Headcount = require('../models/headcount');
const Place = require('../models/place');
const { getFormattedDate } = require('../utils/dateUtils');
const { verifyToken } = require('./middlewares/authorization');
const router = express.Router();

/** ⚙️ [headcounts] collection에 대한 Model definition
 * @swagger
 * definitions:
 *   Headcount:
 *     type: object
 *     required:
 *       - _id
 *       - placeId
 *       - headcount
 *       - createdTime
 *     properties:
 *       _id:
 *         type: string
 *         format: ObjectId
 *         description: headcountId
 *       placeId:
 *         type: string
 *         format: ObjectId
 *         description: headcountId 연관된 placeId
 *       headcount:
 *         type: number
 *         description: 인원수
 *       createdTime:
 *         type: string
 *         example: "2023-07-29 20:44:51.681"
 *         description: 인원수 정보가 추가된 일자 및 시각
 *       __v:
 *         type: number
 *         description: version key
 */

// :id값에 따른 document 중 placeId값이 :id와 동일한 document(s) 설정 및 조회
const getPlaceInformations = async (req, res, next) => {
  const placeId = req.params.id;

  if (!placeId) return res.status(400).json({ error: 'Bad Request' });
  if (!mongoose.Types.ObjectId.isValid(placeId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  try {
    const placeInformations = await Headcount.find({ placeId });
    if (!placeInformations) return res.status(404).json({ error: 'Not Found' });

    res.placeInformations = placeInformations;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

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

// 인자로 들어온 배열의 각 요소인 Object에 updateElapsedTime 속성을 기준에 맞게 추가함
const addUpdateElapsedTimeProp = (currPlaceInformations) => {
  // PlaceId 별로 데이터를 그룹화
  const placeIdGroups = {};
  for (const info of currPlaceInformations) {
    const placeIdStr = info.placeId._id.toString();
    if (!placeIdGroups[placeIdStr]) {
      placeIdGroups[placeIdStr] = [];
    }
    placeIdGroups[placeIdStr].push(info);
  }

  // 현재 일자를 가져옴
  const currentTime = new Date();

  // 각 그룹에 대해 가장 최신의 데이터 선택하고 updateElapsedTime 계산
  let updatedPlaceInformations = [];
  for (const placeIdStr in placeIdGroups) {
    const group = placeIdGroups[placeIdStr];
    group.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime)); // 가장 최신 데이터가 앞으로 오게 정렬

    // 최신 데이터만 선택
    const latestInfo = group[0];
    const elapsedTime =
      group.length > 1
        ? Math.floor((currentTime - new Date(group[1].createdTime)) / 1000)
        : -1;

    let updatedInfo = latestInfo.toObject();
    updatedInfo.updateElapsedTime = elapsedTime;
    updatedPlaceInformations.push(updatedInfo);
  }

  // 가장 최신으로 등록된 인원수 데이터의 일자가 배열의 앞으로 오도록 정렬
  updatedPlaceInformations.sort(
    (a, b) => new Date(b.createdTime) - new Date(a.createdTime)
  );

  return updatedPlaceInformations;
};

// markerId._id 별로 가장 근래의 createdTime을 가진 항목만 선택
const filterAndSortByCreatedTime = (currPlaceInformations) => {
  const markerIdGroups = {};
  for (const info of currPlaceInformations) {
    const markerIdStr = info.placeId.markerId._id.toString();
    if (
      !markerIdGroups[markerIdStr] ||
      new Date(info.createdTime) >
        new Date(markerIdGroups[markerIdStr].createdTime)
    ) {
      markerIdGroups[markerIdStr] = info;
    }
  }

  // Object values로 최종 배열 생성
  currPlaceInformations = Object.values(markerIdGroups);

  // 가장 최신으로 등록된 인원수 데이터의 일자가 배열의 앞으로 오도록 정렬
  currPlaceInformations.sort(
    (a, b) => new Date(b.createdTime) - new Date(a.createdTime)
  );

  return currPlaceInformations;
};

/**
 * @swagger
 * /api/headcounts:
 *   get:
 *     tags:
 *       - Headcounts Collection 기반 API
 *     summary: (headcounts) Collection 내의 모든 Document(s) 반환 ➜ [In-App use ❌]
 *     description: (headcounts) collection 내의 모든 데이터 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Headcount'
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
    const placeInformations = await Headcount.find();
    if (!placeInformations) return res.status(404).json({ error: 'Not Found' });

    return res.status(200).json(placeInformations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/headcounts/public/placeInformations:
 *   get:
 *     tags:
 *       - Headcounts Collection 기반 API
 *     summary: 등록된 모든 장소에 대한 세부 정보 반환
 *     description: 각 장소에 대한 인원수와 장소 세부 정보 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *          items:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             placeId:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 placeName:
 *                   type: string
 *                 address:
 *                   type: string
 *                 detailAddress:
 *                   type: string
 *                 markerId:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     latitude:
 *                       type: string
 *                     longitude:
 *                       type: string
 *                     __v:
 *                       type: number
 *                 __v:
 *                   type: number
 *             headcount:
 *               type: number
 *             createdTime:
 *               type: string
 *               example: "2023-07-29 20:44:51.681"
 *             __v:
 *               type: number
 *             updateElapsedTime:
 *               type: number
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
router.get('/public/placeInformations', async (req, res) => {
  try {
    const placeInformations = await Headcount.find()
      .populate({
        path: 'placeId',
        populate: { path: 'markerId' },
      })
      .exec();
    if (!placeInformations) {
      return res.status(404).json({ error: 'Not Found' });
    }

    const updatedPlaceInformations = filterAndSortByCreatedTime(
      addUpdateElapsedTimeProp(placeInformations)
    );

    return res.status(200).json(updatedPlaceInformations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/headcounts/{placeId}:
 *   get:
 *     tags:
 *       - Headcounts Collection 기반 API
 *     summary: 특정 장소에 대한 인원수 세부 정보 반환 ➜ [In-App use ❌]
 *     description: 특정 장소에 대한 인원수 세부 정보를 반환합니다.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         description: placeId
 *         type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             placeId:
 *               type: string
 *             headcount:
 *               type: number
 *             createdTime:
 *               type: string
 *               example: "2023-07-29 20:44:51.681"
 *             __v:
 *               type: number
 *             updateElapsedTime:
 *               type: number
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Bad Request"
 *       404:
 *         description: Not Found
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Not Found"
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
router.get('/:id', getPlaceInformations, async (req, res) => {
  const updatedPlaceInformations = addUpdateElapsedTimeProp(
    res.placeInformations
  );
  return res.status(200).json(updatedPlaceInformations[0]);
});

/**
 * @swagger
 * /api/headcounts/public/{markerId}/placeInformations:
 *   get:
 *     tags:
 *       - Headcounts Collection 기반 API
 *     summary: 특정 마커 위치에 대한 장소 정보 및 인원수 세부 정보 반환
 *     description: 특정 마커 위치에 대한 장소 정보 및 인원수 세부 정보를 반환합니다.
 *     parameters:
 *       - in: path
 *         name: markerId
 *         required: true
 *         description: markerId
 *         type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               placeId:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   placeName:
 *                     type: string
 *                   address:
 *                     type: string
 *                   detailAddress:
 *                     type: string
 *                   markerId:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       latitude:
 *                         type: string
 *                       longitude:
 *                         type: string
 *                       __v:
 *                         type: number
 *                   __v:
 *                     type: number
 *               headcount:
 *                 type: number
 *               createdTime:
 *                 type: string
 *                 example: "2023-07-29 20:44:51.681"
 *               __v:
 *                 type: number
 *               updateElapsedTime:
 *                 type: number
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Bad Request"
 *       404:
 *         description: Not Found
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Not Found"
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
router.get(
  '/public/:id/placeInformations',
  getPlaceInformations,
  async (req, res) => {
    try {
      const placeId = req.params.id;
      const placeInformations = await Headcount.find()
        .populate({
          path: 'placeId',
          populate: { path: 'markerId' },
        })
        .exec();
      if (!placeInformations) {
        return res.status(404).json({ error: 'Not Found' });
      }
      const filteredPlaceInformations = placeInformations.filter(
        (info) => info.placeId.markerId._id.toString() === placeId
      );
      const updatedPlaceInformations = addUpdateElapsedTimeProp(
        filteredPlaceInformations
      );
      return res.status(200).json(updatedPlaceInformations);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/headcounts/private/{placeId}:
 *   post:
 *     tags:
 *       - Headcounts Collection 기반 API
 *     summary: 특정 장소에 대한 인원수 등록
 *     security:
 *       - JWT: []
 *     description: 특정 장소에 대한 인원수 정보를 추가합니다.
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         description: placeId
 *         type: string
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - headcount
 *           properties:
 *             headcount:
 *               type: number
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             placeId:
 *               type: string
 *             headcount:
 *               type: number
 *             createdTime:
 *               type: string
 *               example: "2023-07-29 20:44:51.681"
 *             __v:
 *               type: number
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
router.post('/private/:id', verifyToken, getPlace, async (req, res) => {
  if (
    (!req.body.headcount && req.body.headcount < 0) ||
    typeof req.body.headcount !== 'number'
  )
    return res.status(400).json({ error: 'Bad Request' });

  const headcount = new Headcount(req.body);
  headcount.placeId = req.params.id;
  headcount.createdTime = getFormattedDate();

  try {
    const newHeadcount = await headcount.save();
    return res.status(201).json(newHeadcount);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
