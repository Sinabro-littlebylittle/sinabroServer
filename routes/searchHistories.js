const express = require('express');
const mongoose = require('mongoose');
const SearchHistory = require('../models/searchHistory');
const { verifyToken } = require('./middlewares/authorization');
const { getFormattedDate } = require('../utils/dateUtils');
const router = express.Router();

/** ⚙️ [searchHistory] collection에 대한 Model definition
 * @swagger
 * definitions:
 *   SearchHistory:
 *     type: object
 *     required:
 *       - _id
 *       - searchKeyword
 *       - latitude
 *       - longitude
 *       - createdTime
 *       - userId
 *       - __v
 *     properties:
 *       _id:
 *         type: string
 *         format: ObjectId
 *         description: searchHistoryId
 *       searchKeyword:
 *         type: string
 *         description: 검색하여 선택한 키워드
 *       latitude:
 *         type: string
 *         description: 검색하여 선택한 장소의 위도
 *       longitude:
 *         type: string
 *         description: 검색하여 선택한 장소의 경도
 *       createdTime:
 *         type: string
 *         example: "2023-07-29 20:44:51.681"
 *         description: 검색 기록 데이터가 추가된 일자 및 시각
 *       userId:
 *         type: string
 *         format: ObjectId
 *         description: searchHistoryId와 연관된 userId
 *       __v:
 *         type: number
 *         description: version key
 */

const getSearchHistory = async (req, res, next) => {
  const searchHistoryId = req.params.id;

  if (!searchHistoryId) return res.status(400).json({ error: 'Bad Request' });
  if (!mongoose.Types.ObjectId.isValid(searchHistoryId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  try {
    const searchHistory = await SearchHistory.findById(searchHistoryId);
    if (!searchHistory) return res.status(404).json({ error: 'Not Found' });

    res.searchHistory = searchHistory;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/search-histories/private:
 *   get:
 *     tags:
 *       - SearchHistory Collection 기반 API
 *     summary: 검색하여 선택했던 장소 목록 반환
 *     security:
 *       - JWT: []
 *     description: (search_history) collection 내에서 사용자가 검색하여 선택했던 장소 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/SearchHistory'
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
    const currentYear = new Date().getFullYear();
    const startOfCurrentYear = `${currentYear}-01-01 00:00:00.000`;

    // 작년 데이터 찾기
    const lastYearHistories = await SearchHistory.find({
      userId,
      createdTime: {
        $lt: startOfCurrentYear,
      },
    });

    console.log('작년 데이터:', lastYearHistories);

    // 작년 데이터 삭제
    if (lastYearHistories.length > 0) {
      const idsToDelete = lastYearHistories.map((history) => history._id);
      await SearchHistory.deleteMany({ _id: { $in: idsToDelete } });
    }

    // 남아 있는 데이터 조회
    const searchHistories = await SearchHistory.find({ userId });
    if (searchHistories.length === 0)
      return res.status(404).json({ error: 'Not Found' });

    return res.status(200).json(searchHistories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/search-histories/private:
 *   post:
 *     tags:
 *       - SearchHistory Collection 기반 API
 *     summary: 검색하여 선택했던 장소 정보 등록
 *     security:
 *       - JWT: []
 *     description: 사용자가 검색 후 선택한 장소 정보를 등록합니다.
 *     parameters:
 *       - in: body
 *         name: searchHistoryRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             searchKeyword:
 *               type: string
 *             latitude:
 *               type: string
 *             longitude:
 *               type: string
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           $ref: '#/definitions/SearchHistory'
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
  const { searchKeyword, latitude, longitude } = req.body;

  if (!searchKeyword || !latitude || !longitude)
    return res.status(400).json({ error: 'Bad Request' });

  const userId = res.locals.sub;

  try {
    // /** 동일한 searchKeyword, latitude, longitude, userId를 가진 document가
    // 있는지 확인 후 해당 document 제거 */
    await SearchHistory.findOneAndDelete({
      searchKeyword,
      latitude,
      longitude,
      userId,
    });

    const searchHistory = new SearchHistory(req.body);

    searchHistory.userId = userId;
    searchHistory.createdTime = getFormattedDate();

    const newSearchHistory = await searchHistory.save();
    return res.status(201).json(newSearchHistory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/search-histories/private/{searchHistoryId}:
 *   delete:
 *     tags:
 *       - SearchHistory Collection 기반 API
 *     summary: 검색하여 선택했던 장소 정보 제거
 *     security:
 *       - JWT: []
 *     description: 사용자가 검색 후 선택하여 저장된 장소 정보 기록을 제거합니다.
 *     parameters:
 *       - in: path
 *         name: searchHistoryId
 *         required: true
 *         description: searchHistoryId
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
router.delete(
  '/private/:id',
  verifyToken,
  getSearchHistory,
  async (req, res) => {
    try {
      const result = await SearchHistory.findByIdAndDelete(
        res.searchHistory._id
      );

      if (!result) return res.status(404).json({ error: 'Not Found' });

      res.status(200).json({ message: 'OK' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
