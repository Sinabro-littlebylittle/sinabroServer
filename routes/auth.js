const express = require('express');
const UserInfo = require('../models/user_info');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();

const options = {
  iss: process.env.JWT_ISSUER,
  aud: process.env.JWT_AUDIENCE,
};

const createHashedPassword = (password) => {
  return crypto.createHash('sha512').update(password).digest('base64');
};

router.get('/public/search', async (req, res) => {
  const email = req.query.email;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) {
    return res.status(400).json({ error: 'Bad request' });
  }

  try {
    // 이메일이 이미 존재하는지 확인
    const existingUser = await UserInfo.findOne({ email });
    // 이미 존재하는 이메일이면 에러 메시지를 전달
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
      });
    }

    return res.status(200).json({ error: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.error });
  }
});

/**
 * @swagger
 * /api/auth/public/login:
 *   post:
 *     tags:
 *       - 회원 인증 API
 *     summary: 로그인
 *     description: 사용자 (이메일/비밀번호)를 통해 로그인 후 액세스 토큰을 발급합니다.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: loginRequest
 *         description: loginRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzaW5hYnJvIiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDUwIiwic3ViIjoiNjRiYWNhNDQxYjA2ZjU2OTJkNTljYTg1IiwiaWF0IjoxNjkwNDIxOTA3LCJleHAiOjE2OTA0MjI1MDd9.0SOH2JtMICYXxdglFzBeciuOD1MbZUqlEkm3zF_lPnU"
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Invalid credentials"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/public/login', async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ error: 'bad request' });
  }

  try {
    const user = await UserInfo.findOne({
      id: req.body.id,
      password: createHashedPassword(req.body.password),
    });
    if (user) {
      options.sub = user._id;
      const token = jwt.sign(options, process.env.JWT_TOKEN_SECRET, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
      });

      res.cookie('user', token);
      return res.status(200).json({ accessToken: token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    return res.status(500).json({ error: err.error });
  }
});

/**
 * @swagger
 * /api/auth/public/signup:
 *   post:
 *     tags:
 *       - 회원 인증 API
 *     summary: 회원가입
 *     description: (이메일, 비밀번호, 닉네임)을 통해 신규 회원을 등록합니다.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: signUpRequest
 *         description: signUpRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *             username:
 *               type: string
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               example: "abc@naver.com"
 *             password:
 *               type: string
 *               example: "xwtd2ev7b1HQnUEytxcMnSB1CnhS8AaA9lZY8DEOgQBW5nY8NMmgCw6UAHb1RJXBafwjAszrMSA5JxxDRpUH3A=="
 *             username:
 *               type: string
 *               example: "jenny"
 *             role:
 *               type: string
 *               example: "member"
 *             _id:
 *               type: string
 *               example: "64c1cc9d3a8b77048c1696aa"
 *             __v:
 *               type: number
 *               example: 0
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             errror:
 *               type: string
 *               example: "Bad request or user with this email already exists"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/public/signup', async (req, res) => {
  if (!req.body.email || !req.body.password || !req.body.username) {
    return res.status(400).json({ error: 'bad request' });
  }

  try {
    // 이메일이 이미 존재하는지 확인
    const existingUser = await UserInfo.findOne({ email: req.body.email });

    // 이미 존재하는 이메일이면 에러 메시지를 전달
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad request or user with this email already exists',
      });
    }

    const encryptedPassword = createHashedPassword(req.body.password);

    const user = new UserInfo({
      email: req.body.email,
      password: encryptedPassword,
      username: req.body.username,
      role: 'member',
    });

    const newUser = await new UserInfo(user).save();
    res.status(201).json(newUser);
  } catch (err) {
    return res.status(500).json({ error: err.error });
  }
});

module.exports = router;
