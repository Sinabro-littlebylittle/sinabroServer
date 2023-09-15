const express = require('express');
const mongoose = require('mongoose');
const UserInfo = require('../models/user_info');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { verifyToken } = require('./middlewares/authorization');
const { env } = require('process');
const router = express.Router();

/** ⚙️ [user_infos] collection에 대한 Model definition
 * @swagger
 * definitions:
 *   UserInfo:
 *     type: object
 *     required:
 *       - id
 *       - email
 *       - password
 *       - username
 *       - role
 *       - point
 *       - __v
 *     properties:
 *       _id:
 *         type: string
 *         format: 'ObjectId'
 *         description: userId
 *       email:
 *         type: string
 *         description: 이메일
 *       password:
 *         type: string
 *         description: 비밀번호
 *       username:
 *         type: string
 *         description: 유저명
 *       role:
 *         type: string
 *         description: 역할
 *       point:
 *         type: number
 *         description: 포인트
 *       createdTime:
 *         type: string
 *         example: "2023-07-29 20:44:51.681"
 *         description: 유저 데이터가 추가된 일자 및 시각
 *       __v:
 *         type: number
 *         description: version key
 */

const createHashedPassword = (password) => {
  return crypto.createHash('sha512').update(password).digest('base64');
};

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
 *            point:
 *              type: number
 *      400:
 *        description: Bad Request
 *        schema:
 *          type: object
 *          properties:
 *            error:
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
router.get('/private/info', verifyToken, getUserInfo, async (req, res) => {
  const userInfo = res.userInfo;
  return res.status(200).json(userInfo);
});

/**
 * @swagger
 * /api/user/generate-temp-password:
 *   post:
 *     tags:
 *       - 사용자 관련 API
 *     summary: 임시 비밀번호 생성
 *     security:
 *       - JWT: []
 *     description: 회원의 기존 비밀번호 대신 임시 비밀번호로 변경되며, 요청된 이메일 주소로 임시 비밀번호를 발송합니다.
 *     parameters:
 *       - in: body
 *         name: userRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             email:
 *               type: string
 *             username:
 *               type: string
 *             role:
 *               type: string
 *             point:
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
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/generate-temp-password', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Bad Request' });

  try {
    const user = await UserInfo.findOne({ email }).select('-password -__v');
    if (!user) return res.status(404).send({ message: 'Not Found' });

    // 임의의 비밀번호 생성
    const randomPassword = crypto.randomBytes(4).toString('hex');

    // 비밀번호 업데이트
    user.password = createHashedPassword(randomPassword);

    const newUser = await user.save();

    // 이메일 전송 설정
    const transporter = nodemailer.createTransport({
      service: process.env.NODE_MAILER_SERVICE_NAME,
      auth: {
        user: process.env.NODE_MAILER_ADDRESS,
        pass: process.env.NODE_MAILER_PWD,
      },
    });

    const mailOptions = {
      from: process.env.NODE_MAILER_ADDRESS,
      to: newUser.email,
      subject: process.env.NODE_MAILER_SUBJECT,
      html: `<div>
      <table
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="width: 100%; max-width: 750px; min-width: 320px"
      >
        <tbody>
          <tr>
            <td>
              <table
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="width: 100%; max-width: 750px; min-width: 320px"
              >
                <tbody>
                  <tr>
                    <td>
                      <div style="padding: 25px 20px 55px 10px">
                        <a
                          href="https://sinabro-developersung13.koyeb.app/"
                          target="_blank"
                          rel="noreferrer noopener"
                          style="text-decoration: none"
                          ><img
                            src="https://avatars.githubusercontent.com/u/114721330?s=200&v=4"
                            alt="MUSINSA"
                            height="50px; border:0;"
                            loading="lazy"
                          />
                          <span
                            style="
                              font-weight: 500;
                              font-size: 1.5rem;
                              color: black;
                              position: relative;
                              bottom: 0.3rem;
                              left: -0.5rem;
                              letter-spacing: 0.025rem;
                            "
                          >
                            sinabro
                          </span>
                        </a>
                      </div>
                      <div
                        style="
                          width: 100%;
                          padding: 0 20px;
                          margin: 0 auto;
                          font-family: Malgun Gothic;
                          box-sizing: border-box;
                        "
                      >
                        <div
                          style="
                            font-size: 28px;
                            font-weight: bold;
                            color: #000;
                            padding-bottom: 15px;
                            border-bottom: 4px solid #000;
                            height: 30px;
                            line-height: 28px;
                          "
                        >
                          임시 비밀번호 발급
                        </div>
                        <div
                          style="
                            font-size: 14px;
                            color: #666;
                            line-height: 22px;
                            margin: 20px 0 0 0;
                          "
                        >
                          로그인 후에 비밀번호를 반드시 변경해 주십시오.
                        </div>
                        <div
                          style="
                            font-size: 18px;
                            font-weight: bold;
                            background: #eee;
                            padding: 11px 12px 11px 20px;
                            margin-top: 40px;
                          "
                        >
                          <span
                            style="
                              display: inline-block;
                              height: 30px;
                              line-height: 30px;
                            "
                            >회원정보</span
                          >
                        </div>
                        <table
                          cellspacing="0"
                          cellpadding="0"
                          border="0"
                          style="
                            width: 100%;
                            border: 1px solid #eee;
                            border-bottom: 0;
                          "
                        >
                          <tbody>
                            <tr>
                              <th
                                colspan="1"
                                rowspan="1"
                                style="
                                  width: 80px;
                                  font-size: 14px;
                                  font-weight: bold;
                                  border-bottom: 1px solid #eee;
                                  padding: 16px 20px 15px 20px;
                                  text-align: left;
                                "
                              >
                                비밀번호
                              </th>
                              <td
                                style="
                                  font-size: 14px;
                                  color: #999;
                                  line-height: 22px;
                                  border-bottom: 1px solid #eee;
                                  padding: 16px 0 15px 0;
                                "
                              >
                                ${randomPassword}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div
                          style="
                            font-size: 14px;
                            color: #999;
                            margin: 35px 0 60px;
                            line-height: 22px;
                          "
                        >
                          COPYRIGHTS (C)SINABRO ALL RIGHTS RESERVED.
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      } else {
        return res.status(201).json({ message: newUser });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/user/private/point:
 *   patch:
 *    tags:
 *      - 사용자 관련 API
 *    summary: 회원 포인트 증가/감소
 *    security:
 *      - JWT: []
 *    description: 회원의 기존 포인트를 증가 또는 감소시킵니다.
 *    parameters:
 *      - in: body
 *        name: pointRequest
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            point:
 *              type: number
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
 *      500:
 *        description: Internal Server Error
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Internal Server Error"
 */
router.patch('/private/point', verifyToken, async (req, res) => {
  const { point } = req.body;
  const userId = res.locals.sub;

  if (!point || typeof req.body.point !== 'number')
    return res.status(400).json({ error: 'Bad Request' });

  try {
    const result = await UserInfo.updateMany(
      { _id: userId }, // Filter
      { $inc: { point } } // Increment/Decrease the point value by the given amount
    );

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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
 *            username:
 *              type: string
 *            email:
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
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Bad Request' });
  }

  const userInfo = res.userInfo;

  try {
    // 이메일이 이미 존재하는지 확인
    const existingUser = await UserInfo.findOne({
      email: {
        $eq: email,
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
      { $set: { username, email } } // Update action
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
 *            password:
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
  '/private/password',
  verifyToken,
  getUserInfo,
  async (req, res) => {
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Bad Request' });

    const userInfo = res.userInfo;

    try {
      const result = await UserInfo.updateOne(
        { _id: userInfo._id }, // Filter
        { $set: { password: createHashedPassword(password) } } // Update action
      );

      return res.status(200).json({ message: 'OK' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
