const express = require('express');
const mongoose = require('mongoose');
const UserInfo = require('../models/user_info');
const { verifyToken } = require('./middlewares/authorization');
const Place = require('../models/place');
const router = express.Router();

const getUserInfo = async (req, res, next) => {
  let userId = req.params.id;
  if (!userId) userId = res.locals.sub;

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  let userInfo;
  try {
    userInfo = await UserInfo.findById(userId).select('-password -__v');
    if (!userInfo) res.status(404).json({ error: 'Not Found' });

    res.userInfo = userInfo;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.error });
  }
};

/**
 * @swagger
 * /api/user/private/info:
 *   get:
 *    tags:
 *      - 사용자 관련 API
 *    summary: Get User Information
 *    security:
 *      - JWT: []
 *    description: Retrieve the user information based on the user ID.
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            _id:
 *              type: string
 *            email:
 *              type: string
 *            username:
 *              type: string
 *            role:
 *              type: string
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
router.get('/private/info', verifyToken, getUserInfo, async (req, res) => {
  const userInfo = res.userInfo;
  return res.status(200).json(userInfo);
});

module.exports = router;
