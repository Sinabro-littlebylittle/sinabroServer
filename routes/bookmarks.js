const express = require('express');
const mongoose = require('mongoose');
const Bookmark = require('../models/bookmark');
const UserInfo = require('../models/user_info');
const Place = require('../models/place');
const Headcount = require('../models/headcount');
const { verifyToken } = require('./middlewares/authorization');
const router = express.Router();

/** ⚙️ [bookmarks] collection에 대한 Model definition
 * @swagger
 * definitions:
 *   Bookmark:
 *     type: object
 *     required:
 *       - _id
 *       - userId
 *       - bookmarkName
 *       - iconColor
 *     properties:
 *       _id:
 *         type: string
 *         format: ObjectId
 *         description: bookmarkId
 *       userId:
 *         type: string
 *         format: ObjectId
 *         description: bookmarkId와 연관된 userId
 *       bookmarkName:
 *         type: string
 *         description: 즐겨찾기 리스트 이름
 *       iconColor:
 *         type: number
 *         description: 즐겨찾기 리스트 아이콘 색상 번호
 *       bookmarkedPlaceId:
 *         type: array
 *         items:
 *           type: string
 *           format: ObjectId
 *         description: 즐겨찾기된 장소ID 배열
 *       __v:
 *         type: number
 *         description: version key
 */

// :id값에 따른 document 중 bookmarkId값이 :id와 동일한 document 설정 및 조회
const getBookmark = async (req, res, next) => {
  const bookmarkId = req.params.id;

  if (!bookmarkId) return res.status(400).json({ error: 'Bad Request' });
  if (!mongoose.Types.ObjectId.isValid(bookmarkId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  try {
    const bookmark = await Bookmark.findById(bookmarkId);
    if (!bookmark) return res.status(404).json({ error: 'Not Found' });

    res.bookmark = bookmark;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// :id값에 따른 document 중 _id값이 :id와 동일한 document 설정 및 조회
const getPlace = async (req, res, next) => {
  let { placeId } = req.body;
  if (!placeId) placeId = req.query.placeId;
  if (!placeId) placeId = req.params.id;

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

const verifyBookmarkIds = (req, res, next) => {
  const bookmarkIds = req.body;

  if (!bookmarkIds || bookmarkIds.length === 0)
    return res.status(400).json({ error: 'Bad Request' });

  for (let bookmarkId of bookmarkIds) {
    if (!mongoose.Types.ObjectId.isValid(bookmarkId)) {
      return res.status(415).json({ error: 'Unsupported Media Type' });
    }
  }

  res.bookmarkIds = bookmarkIds;
  next();
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

/**
 * @swagger
 * /api/bookmarks/private:
 *   get:
 *     tags:
 *       - Bookmarks Collection 기반 API
 *     summary: 회원의 즐겨찾기 리스트 정보 목록 반환
 *     security:
 *       - JWT: []
 *     description: (bookmarks) collection 내에서 사용자가 등록한 즐겨찾기 리스트 정보 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Bookmark'
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
router.get('/private', verifyToken, async (req, res) => {
  const userId = res.locals.sub;

  try {
    const bookmarks = await Bookmark.find({ userId });
    if (bookmarks.length === 0)
      return res.status(404).json({ error: 'Not Found' });

    return res.status(200).json(bookmarks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/bookmarks/private/bookmarkedPlace/bookmarks/{bookmarkId}:
 *   get:
 *     tags:
 *       - Bookmarks Collection 기반 API
 *     summary: 회원의 즐겨찾기 리스트 내 즐겨찾기된 장소 정보 반환
 *     security:
 *       - JWT: []
 *     description: 사용자가 등록한 즐겨찾기 리스트 내 즐겨찾기된 장소 정보 목록을 반환합니다.
 *     parameters:
 *       - in: path
 *         name: bookmarkId
 *         required: true
 *         description: bookmarkId
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Place'
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
  '/private/bookmarkedPlace/bookmarks/:id',
  getBookmark,
  async (req, res) => {
    try {
      const bookmark = res.bookmark;

      // Check each ObjectId in bookmarkedPlaceId
      for (const placeId of bookmark.bookmarkedPlaceId) {
        const placeExists = await Place.findById(placeId);
        if (!placeExists) {
          // If the place doesn't exist in the places collection, remove its ObjectId from the bookmarkedPlaceId array
          await Bookmark.findByIdAndUpdate(bookmark._id, {
            $pull: { bookmarkedPlaceId: placeId },
          });
        }
      }

      // Reload the updated bookmark
      const updatedBookmark = await Bookmark.findById(bookmark._id);

      const placeInformations = await Headcount.find()
        .populate({
          path: 'placeId',
          populate: { path: 'markerId' },
        })
        .exec();
      if (placeInformations.length === 0)
        return res.status(404).json({ error: 'Not Found' });

      const filteredPlaceInformations = placeInformations.filter((placeInfo) =>
        bookmark.bookmarkedPlaceId.includes(placeInfo.placeId._id.toString())
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
 * /api/bookmarks/private/bookmarkedPlace/places/{placeId}:
 *   get:
 *     tags:
 *       - Bookmarks Collection 기반 API
 *     summary: 특정 장소가 즐겨찾기된 즐겨찾기 리스트 목록 정보 반환
 *     security:
 *       - JWT: []
 *     description: 특정 장소에 대하여 현재 사용자의 즐겨찾기 리스트 중에서 해당 장소가 추가되어 있는 즐겨찾기 리스트 목록 정보를 반환합니다.
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
 *           items:
 *             $ref: '#/definitions/Bookmark'
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
  '/private/bookmarkedPlace/places/:id',
  verifyToken,
  getPlace,
  async (req, res) => {
    const userId = res.locals.sub;
    const place = res.place;

    try {
      const bookmarks = await Bookmark.find({
        userId,
        bookmarkedPlaceId: place._id,
      });

      if (bookmarks.length === 0)
        return res.status(404).json({ error: 'Not Found' });

      // 조건을 만족하는 모든 bookmarks를 반환한다.
      return res.status(200).json(bookmarks);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/bookmarks/private:
 *   post:
 *     tags:
 *       - Bookmarks Collection 기반 API
 *     summary: 신규 즐겨찾기 리스트 등록
 *     security:
 *       - JWT: []
 *     description: 새로운 즐겨찾기 리스트를 추가합니다.
 *     parameters:
 *       - in: body
 *         name: bookmarksRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             bookmarkName:
 *               type: string
 *             iconColor:
 *               type: number
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           properties:
 *             _id:
 *               type: string
 *             userId:
 *               type: string
 *             bookmarkName:
 *               type: string
 *             iconColor:
 *               type: string
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
router.post('/private', verifyToken, async (req, res) => {
  const { bookmarkName, iconColor } = req.body;

  if (!bookmarkName || !iconColor || typeof req.body.iconColor !== 'number')
    return res.status(400).json({ error: 'Bad Request' });

  const userId = res.locals.sub;

  try {
    const bookmark = new Bookmark(req.body);
    bookmark.userId = userId;
    const newBookmark = await bookmark.save();
    return res.status(201).json(newBookmark);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/bookmarks/private/bookmarkedPlace/places/{placeId}:
 *   post:
 *    tags:
 *      - Bookmarks Collection 기반 API
 *    summary: 여러 즐겨찾기 리스트 내 장소 일괄 등록
 *    security:
 *      - JWT: []
 *    description: 선택된 다수의 즐겨찾기 리스트 내에 사용자가 선택한 장소를 즐겨찾기로 일괄 등록합니다.
 *    parameters:
 *      - in: path
 *        name: placeId
 *        required: true
 *        description: placeId
 *        type: string
 *      - in: body
 *        name: bookmarkIds
 *        description: List of bookmark IDs to add
 *        required: true
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "OK"
 *      400:
 *        description: Bad request
 *        schema:
 *          type: object
 *          properties:
 *            errror:
 *              type: string
 *              example: "Bad Request"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unauthorized"
 *      404:
 *        description: Not Found
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Not Found"
 *      409:
 *        description: Conflict
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "BookmarkedPlaceId with this placeId already exists"
 *      415:
 *        description: Unsupported Media Type
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unsupported Media Type"
 *      500:
 *        description: Internal Server Error
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Internal Server Error"
 */
router.post(
  '/private/bookmarkedPlace/places/:id',
  verifyToken,
  verifyBookmarkIds,
  getPlace,
  async (req, res) => {
    const bookmarkIds = res.bookmarkIds;
    const place = res.place;

    try {
      // bookmarks collection 내에서 bookmarkIds에 있는 ObjectId와 일치하는 document들을 찾음
      const result = await Bookmark.find({
        _id: { $in: bookmarkIds },
      });

      if (result.length === 0)
        return res.status(404).json({ error: 'Not Found' });

      // 위에서 찾은 bookmarks들 중에서 bookmarkedPlaceId에 placeId가 이미 존재하는 경우 체크
      const alreadyBookmarked = result.some((bookmark) =>
        bookmark.bookmarkedPlaceId.includes(place._id)
      );

      if (alreadyBookmarked) {
        return res.status(409).json({
          message: 'BookmarkedPlaceId with this placeId already exists',
          error: 'Conflict',
        });
      }

      // result에서 찾은 bookmarks들의 bookmarkedPlaceId에 placeId를 추가
      await Bookmark.updateMany(
        { _id: { $in: bookmarkIds } },
        { $push: { bookmarkedPlaceId: place._id } }
      );

      return res.status(200).json({ message: 'OK' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/bookmarks/private/bookmarks/{bookmarkId}:
 *   patch:
 *    tags:
 *      - Bookmarks Collection 기반 API
 *    summary: 즐겨찾기 리스트 정보 수정
 *    security:
 *      - JWT: []
 *    description: 즐겨찾기 리스트 정보를 수정합니다.
 *    parameters:
 *      - in: path
 *        name: bookmarkId
 *        required: true
 *        description: bookmarkId
 *        type: string
 *      - in: body
 *        name: bookmarkRequest
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            bookmarkName:
 *              type: string
 *            iconColor:
 *              type: string
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "OK"
 *      400:
 *        description: Bad request
 *        schema:
 *          type: object
 *          properties:
 *            errror:
 *              type: string
 *              example: "Bad Request"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unauthorized"
 *      404:
 *        description: Not Found
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Not Found"
 *      415:
 *        description: Unsupported Media Type
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unsupported Media Type"
 *      500:
 *        description: Internal Server Error
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Internal Server Error"
 */
router.patch(
  '/private/bookmarks/:id',
  verifyToken,
  getBookmark,
  async (req, res) => {
    const { bookmarkName, iconColor } = req.body;

    if (!bookmarkName || !iconColor || typeof req.body.iconColor !== 'number')
      return res.status(400).json({ error: 'Bad Request' });

    const bookmark = res.bookmark;

    try {
      const result = await Bookmark.updateMany(
        { _id: bookmark._id }, // Filter
        { $set: { bookmarkName, iconColor } } // Update action
      );

      return res.status(200).json({ message: 'OK' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/bookmarks/private:
 *   delete:
 *     tags:
 *       - Bookmarks Collection 기반 API
 *     summary: 특정 즐겨찾기 리스트 일괄 제거
 *     security:
 *       - JWT: []
 *     description: 특정 즐겨찾기 리스트 정보를 담고 있는 document(s)를 제거합니다.
 *     parameters:
 *       - in: body
 *         name: bookmarksIds
 *         description: List of bookmark IDs to delete
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "OK"
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
 *               type: number
 *               example: "Unauthorized"
 *       404:
 *         description: Not Found
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "No bookmarks found to delete"
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
router.delete('/private', verifyToken, verifyBookmarkIds, async (req, res) => {
  const bookmarkIds = res.bookmarkIds;

  try {
    // 여러 아이디에 대해 삭제를 수행합니다.
    const result = await Bookmark.deleteMany({
      _id: { $in: bookmarkIds },
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: 'No bookmarks found to delete', error: 'Not Found' });
    }

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/bookmarks/private/bookmarkedPlace/places/{placeId}:
 *   delete:
 *    tags:
 *      - Bookmarks Collection 기반 API
 *    summary: 여러 즐겨찾기 리스트 내 특정 장소 일괄 제거
 *    security:
 *      - JWT: []
 *    description: 선택된 다수의 즐겨찾기 리스트 내에서 사용자가 선택한 장소를 즐겨찾기에서 일괄적으로 제거합니다.
 *    parameters:
 *      - in: path
 *        name: placeId
 *        required: true
 *        description: placeId
 *        type: string
 *      - in: body
 *        name: bookmarkIds
 *        description: List of bookmark IDs to add
 *        required: true
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "OK"
 *      400:
 *        description: Bad request
 *        schema:
 *          type: object
 *          properties:
 *            errror:
 *              type: string
 *              example: "Bad Request"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unauthorized"
 *      404:
 *        description: Not Found
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Not Found"
 *      409:
 *        description: Conflict
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "BookmarkedPlaceId with this placeId already exists"
 *      415:
 *        description: Unsupported Media Type
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unsupported Media Type"
 *      500:
 *        description: Internal Server Error
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Internal Server Error"
 */
router.delete(
  '/private/bookmarkedPlace/places/:id',
  verifyToken,
  verifyBookmarkIds,
  getPlace,
  async (req, res) => {
    const bookmarkIds = res.bookmarkIds;
    const place = res.place;

    try {
      // bookmarkIds에 해당하는 모든 북마크를 업데이트하고, bookmarkedPlaceId 배열에서 placeId 제거
      const result = await Bookmark.updateMany(
        { _id: { $in: bookmarkIds } }, // bookmarkIds 안의 ID들과 일치하는 북마크 찾기
        { $pull: { bookmarkedPlaceId: place._id } } // bookmarkedPlaceId 배열에서 placeId 제거
      );

      return res.status(200).json({ message: 'OK' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
