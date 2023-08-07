const express = require('express');
const mongoose = require('mongoose');
const UserInfo = require('../models/user_info');
const crypto = require('crypto');
const { verifyToken } = require('./middlewares/authorization');
const router = express.Router();

const createHashedPassword = (password) => {
  return crypto.createHash('sha512').update(password).digest('base64');
};

const getUserInfo = async (req, res, next) => {
  let userId = req.params.id;
  if (!userId) userId = res.locals.sub;

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  let userInfo;
  try {
    userInfo = await UserInfo.findById(userId).select('-password -__v');
    if (!userInfo) return res.status(404).json({ error: 'Not Found' });

    res.userInfo = userInfo;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/user/private/info:
 *   get:
 *    tags:
 *      - 사용자 관련 API
 *    summary: 회원 본인 정보 조회
 *    security:
 *      - JWT: []
 *    description: 회원 본인의 정보를 조회합니다.
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

/**
 * @swagger
 * /api/user/private/info:
 *   patch:
 *    tags:
 *      - 사용자 관련 API
 *    summary: 회원 정보 수정
 *    security:
 *      - JWT: []
 *    description: 사용자의 계정 정보를 수정합니다.
 *    parameters:
 *      - in: body
 *        name: passwordRequest
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            newUsername:
 *              type: string
 *            newEmail:
 *              type: string
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            error:
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
 *              example: "User with this email already exists"
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
router.patch('/private/info', verifyToken, getUserInfo, async (req, res) => {
  const { newUsername, newEmail } = req.body;

  if (!newUsername || !newEmail) {
    return res.status(400).json({ error: 'Bad Request' });
  }

  const userInfo = res.userInfo;

  try {
    // 이메일이 이미 존재하는지 확인
    const existingUser = await UserInfo.findOne({
      email: {
        $eq: newEmail,
        $ne: userInfo.email,
      },
    });
    // 이미 존재하는 이메일이면 에러 메시지를 전달
    if (existingUser)
      return res.status(409).json({
        error: 'User with this email already exists',
      });

    const result = await UserInfo.updateMany(
      { _id: userInfo._id }, // Filter
      { $set: { username: newUsername, email: newEmail } } // Update action
    );

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/user/private/password:
 *   patch:
 *    tags:
 *      - 사용자 관련 API
 *    summary: 비밀번호 변경
 *    security:
 *      - JWT: []
 *    description: 사용자의 계정 비밀번호를 변경합니다.
 *    parameters:
 *      - in: body
 *        name: passwordRequest
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            newPassword:
 *              type: string
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            error:
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
  '/private/password',
  verifyToken,
  getUserInfo,
  async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ error: 'Bad Request' });

    const userInfo = res.userInfo;

    try {
      const result = await UserInfo.updateOne(
        { _id: userInfo._id }, // Filter
        { $set: { password: createHashedPassword(newPassword) } } // Update action
      );

      return res.status(200).json({ message: 'OK' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
