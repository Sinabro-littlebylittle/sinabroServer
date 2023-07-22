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

router.post('/public/login', async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: 'bad request' });
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
      return res.status(201).json(token);
    }

    return res.status(400).json({ err: 'invalid user' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/public/signup', async (req, res) => {
  if (!req.body.email || !req.body.password || !req.body.username) {
    return res.status(400).json({ message: 'bad request' });
  }

  try {
    // 이메일이 이미 존재하는지 확인
    const existingUser = await UserInfo.findOne({ email: req.body.email });

    // 이미 존재하는 이메일이면 에러 메시지를 전달
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'A user with this email already exists.' });
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
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
