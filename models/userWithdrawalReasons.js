const mongoose = require('mongoose');

const userWithdrawalReasonsSchema = new mongoose.Schema({
  withdrawalReason: String,
  feedback: String,
  createdTime: String,
});

const UserWithdrawalReason = mongoose.model(
  'user_withdrawal_reasons',
  userWithdrawalReasonsSchema
);

module.exports = UserWithdrawalReason;
