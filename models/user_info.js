const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  email: String,
  password: String,
  username: String,
  role: String,
});

const UserInfo = mongoose.model('user_infos', userInfoSchema);

module.exports = UserInfo;
