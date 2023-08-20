const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookmarkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user_infos' },
  bookmarkName: String,
  iconColor: String,
  bookmarkedPlaceId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'places',
    },
  ],
});

const Bookmark = mongoose.model('bookmarks', bookmarkSchema);
module.exports = Bookmark;
