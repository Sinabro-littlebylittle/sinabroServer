const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const peopleNumberSchema = new Schema(
  {
    placeId: { type: Schema.Types.ObjectId, ref: 'places' },
    peopleCount: Number,
    createdTime: String,
  },
  {
    versionKey: false,
  }
);

const PeopleNumber = mongoose.model('people_number', peopleNumberSchema);

module.exports = PeopleNumber;
