const express = require('express');
const Place = require('../models/place');
const PeopleNumber = require('../models/people_number');
const { getFormattedDate } = require('../utils/dateUtils');
const router = express.Router();

// :id값에 따른 document 중 _id값이 :id와 동일한 document 설정 및 조회
const getPlace = async (req, res, next) => {
  let place;
  try {
    place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Cannot find place' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.place = place;
  next();
};

// places collection 내 모든 document 데이터(들) 반환(Array)
router.get('/', async (req, res) => {
  try {
    const places = await Place.find();
    if (!places) {
      res.status(404).json({ message: 'Item not found.' });
      return;
    }
    res.json(places);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// :id값과 _id 필드의 값이 동일한 document의 데이터를 res.place로 설정 및 조회
router.get('/:id', getPlace, async (req, res) => {
  res.send(res.place);
});

// (장소 정보, places[collection])와 해당 장소의 (인원수 정보, people-numbers[collection])를 DB에 추가
router.post('/', async (req, res) => {
  if (
    !req.body.placeName ||
    !req.body.address ||
    !req.body.detailAddress ||
    !req.body.latitude ||
    !req.body.longitude
  ) {
    return res.status(400).json({ message: 'Missing required field.' });
  }

  const place = new Place({
    placeName: req.body.placeName,
    address: req.body.address,
    detailAddress: req.body.detailAddress,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  });

  try {
    const newPlace = await place.save();
    const peopleNumber = new PeopleNumber({
      placeId: newPlace._id,
      peopleCount: -1,
      createdTime: getFormattedDate,
    });
    const newPeopleNumber = await peopleNumber.save();

    res.status(201).json({ newPlace, newPeopleNumber });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// :id값과 _id 필드의 값이 동일한 document의 placeName, detailAddress 데이터 수정
router.patch('/:id', getPlace, async (req, res) => {
  if (req.body.placeName != null) res.place.placeName = req.body.placeName;
  if (req.body.detailAddress != null)
    res.place.detailAddress = req.body.detailAddress;
  try {
    const updatedPlace = await res.place.save();
    res.status(200).json(updatedPlace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// :id값과 _id 필드의 값이 동일한 (people_number) 및 (places) collection 내 document(들) 삭제
router.delete('/:id', getPlace, async (req, res) => {
  try {
    // people_numbers collection 내 삭제하려는 장소의 _id값을 지닌 연관 document(들) 일괄 제거
    await PeopleNumber.deleteMany({ placeId: res.place._id });
    await res.place.deleteOne();
    res.status(204).json({
      message: 'Deleted (Place information) and (People number info)',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
