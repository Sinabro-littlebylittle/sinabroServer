const express = require('express');
const mongoose = require('mongoose');
const Bookmark = require('../models/bookmark');
const UserInfo = require('../models/user_info');
const Place = require('../models/place');
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
 *         type: string
 *         description: 즐겨찾기 리스트 아이콘 색상
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

// :id값에 따른 document 중 userId값이 :id와 동일한 document 설정 및 조회
const getUserInfo = async (req, res, next) => {
  let userId = req.params.id;
  if (!userId) userId = res.locals.sub;

  if (!userId) return res.status(400).json({ error: 'Bad Request' });
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  try {
    const userInfo = await UserInfo.findById(userId).select('-password -__v');
    if (!userInfo) return res.status(404).json({ error: 'Not Found' });

    res.userInfo = userInfo;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// :id값에 따른 document 중 _id값이 :id와 동일한 document 설정 및 조회
const getPlace = async (req, res, next) => {
  const { placeId } = req.body;

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

// Reqeust Query에 담긴 placeId(s)를 통해 해당 장소의 정보가 담긴 배열을 반환
const getPlacesInformations = async (req, res, next) => {
  const bookmarkId = req.params.id;

  if (!bookmarkId) return res.status(400).json({ error: 'Bad Request' });
  if (!mongoose.Types.ObjectId.isValid(bookmarkId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  try {
    const bookmark = await Bookmark.findById(bookmarkId);
    if (!bookmark) return res.status(404).json({ error: 'Not Found' });

    const placeIds = bookmark.bookmarkedPlaceId;

    const placeInformations = await Place.find({
      _id: {
        $in: placeIds,
      },
    });

    res.placeInformations = placeInformations;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     tags:
 *       - Bookmarks Collection 기반 API
 *     summary: (bookmarks) Collection 내의 모든 Document(s) 반환 ➜ [In-App use ❌]
 *     description: (bookmarks) collection 내의 모든 데이터 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Bookmark'
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
    const bookmarks = await Bookmark.find();
    if (!bookmarks) return res.status(400).json({ error: 'Not Found' });

    return res.status(200).json(bookmarks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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
router.get('/private', verifyToken, getUserInfo, async (req, res) => {
  const userInfo = res.userInfo;

  try {
    const bookmarks = await Bookmark.find({ userId: userInfo._id });
    if (!bookmarks) return res.status(400).json({ error: 'Not Found' });

    return res.status(200).json(bookmarks);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/bookmarks/private/bookmarkedPlace/{bookmarkId}:
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
  '/private/bookmarkedPlace/:id',
  getBookmark,
  getPlacesInformations,
  async (req, res) => {
    const placeInformations = res.placeInformations;

    try {
      return res.status(200).json(placeInformations);
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
 *               type: string
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
router.post('/private', verifyToken, getUserInfo, async (req, res) => {
  const { bookmarkName, iconColor } = req.body;

  if (!bookmarkName || !iconColor)
    return res.status(400).json({ error: 'Bad Request' });

  const userInfo = res.userInfo;

  try {
    const bookmark = new Bookmark(req.body);
    bookmark.userId = userInfo._id;
    const newBookmark = await bookmark.save();
    return res.status(201).json(newBookmark);
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
});

/**
 * @swagger
 * /api/bookmarks/private/{bookmarkId}:
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
router.post('/private/:id', verifyToken, getBookmark, async (req, res) => {
  const { bookmarkName, iconColor } = req.body;

  if (!bookmarkName || !iconColor)
    return res.status(400).json({ error: 'Bad Request' });

  const bookmark = res.bookmark;

  try {
    const result = await Bookmark.updateMany(
      { _id: bookmark._id }, // Filter
      { $set: { bookmarkName, iconColor } } // Update action
    );

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(200).json({ err: err.message });
  }
});

/**
 * @swagger
 * /api/bookmarks/private/bookmarkedPlace/{bookmarkId}:
 *   post:
 *    tags:
 *      - Bookmarks Collection 기반 API
 *    summary: 즐겨찾기 리스트 내 장소 등록
 *    security:
 *      - JWT: []
 *    description: 즐겨찾기 리스트 내에 사용자가 선택한 장소를 즐겨찾기로 등록합니다.
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
 *            placeId:
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
  '/private/bookmarkedPlace/:id',
  verifyToken,
  getBookmark,
  getPlace,
  async (req, res) => {
    const bookmark = res.bookmark;
    const place = res.place;

    try {
      if (!bookmark.bookmarkedPlaceId.includes(place._id)) {
        bookmark.bookmarkedPlaceId.push(place._id);
        await bookmark.save();
        return res.status(200).json({ message: 'OK' });
      }

      return res.status(409).json({
        message: 'BookmarkedPlaceId with this placeId already exists',
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/bookmarks/private/{bookmarkId}:
 *   delete:
 *     tags:
 *       - Bookmarks Collection 기반 API
 *     summary: 특정 즐겨찾기 리스트 제거
 *     security:
 *       - JWT: []
 *     description: 특정 즐겨찾기 리스트 정보를 담고 있는 document를 제거합니다.
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
router.delete('/private/:id', verifyToken, getBookmark, async (req, res) => {
  try {
    await res.bookmark.deleteOne();
    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/bookmarks/private/bookmarkedPlace/{bookmarkId}:
 *   delete:
 *    tags:
 *      - Bookmarks Collection 기반 API
 *    summary: 즐겨찾기 리스트 내 특정 장소 제거
 *    security:
 *      - JWT: []
 *    description: 즐겨찾기 리스트 내에 사용자가 선택한 장소를 즐겨찾기에서 제거합니다.
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
 *            placeId:
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
  '/private/bookmarkedPlace/:id',
  verifyToken,
  getBookmark,
  getPlace,
  async (req, res) => {
    const bookmark = res.bookmark;
    const place = res.place;

    try {
      if (!bookmark.bookmarkedPlaceId.includes(place._id))
        return res.status(404).json({ err: 'Not Found' });

      await Bookmark.findByIdAndUpdate(bookmark._id, {
        $pull: { bookmarkedPlaceId: place._id },
      });
      return res.status(200).json({ message: 'OK' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
