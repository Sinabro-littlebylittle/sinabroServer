const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const headcountSchema = new Schema({
  placeId: { type: Schema.Types.ObjectId, ref: 'places' },
  headcount: Number,
  createdTime: String,
});

const Headcount = mongoose.model('headcounts', headcountSchema);

module.exports = Headcount;
