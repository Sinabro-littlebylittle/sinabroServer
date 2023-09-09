const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const searchHistorySchema = new mongoose.Schema({
  searchKeyword: String,
  latitude: String,
  longitude: String,
  userId: { type: Schema.Types.ObjectId, ref: 'user_infos' },
});

const SearchHistory = mongoose.model('search_history', searchHistorySchema);

module.exports = SearchHistory;
