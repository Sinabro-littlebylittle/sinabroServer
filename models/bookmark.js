const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookmarkSchema = new Schema({
  bookmarkName: String,
  iconColor: Number,
  bookmarkedPlaceId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'places',
    },
  ],
  userId: { type: Schema.Types.ObjectId, ref: 'user_infos' },
});

const Bookmark = mongoose.model('bookmarks', bookmarkSchema);

module.exports = Bookmark;
