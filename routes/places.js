const express = require('express');
const Place = require('../models/place');
const PeopleNumber = require('../models/people_number');
const Marker = require('../models/marker');
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

/**
 * [앱 내 사용 여부 ❌]
 * places collection 내 모든 document 데이터(들) 반환(Array)
 */
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

/**
 * [앱 내 사용 여부 ✅]
 * (장소 정보, places[collection])와 해당 장소의
 * (인원수 정보, people-numbers[collection]), 그리고
 * 요청된 (위도, 경도)에 대한 마커 등록 여부에 따라
 * (마커 정보, markers[collection]) DB에 데이터 추가
 */
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

  let markerId;

  try {
    marker = await Marker.findOne({
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    if (!marker) {
      const newMarker = new Marker({
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      });
      markerId = newMarker.id;
      try {
        await newMarker.save();
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    } else {
      markerId = marker.id;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  try {
    const place = new Place({
      markerId,
      placeName: req.body.placeName,
      address: req.body.address,
      detailAddress: req.body.detailAddress,
    });

    const newPlace = await place.save();

    const peopleNumber = new PeopleNumber({
      placeId: newPlace._id,
      peopleCount: -1,
      createdTime: getFormattedDate(),
    });

    const newPeopleNumber = await peopleNumber.save();
    res.status(201).json(newPlace);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * [앱 내 사용 여부 ✅]
 * :id값과 _id 필드의 값이 동일한 document의 placeName, detailAddress 데이터 수정
 */
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

/**
 * [앱 내 사용 여부 ❌]
 * :id값과 _id 필드의 값이 동일한 (people_number) 및 (places) collection 내 document(들) 삭제
 */
router.delete('/:id', getPlace, async (req, res) => {
  let places;
  try {
    places = await Place.find({
      markerId: res.place.markerId,
    });
    // 삭제하려는 장소 위치(위도, 경도)에 등록된 장소가 한 곳 일 때 마커 데이터도 함께 제거
    if (places.length === 1) {
      try {
        // markers collection 내 삭제하려는 장소의 _id값을 지닌 연관 document 제거
        await Marker.deleteOne({ _id: res.place.markerId });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  try {
    // people_numbers collection 내 삭제하려는 장소의 _id값을 지닌 연관 document(들) 일괄 제거
    await PeopleNumber.deleteMany({ placeId: res.place._id });
    await res.place.deleteOne();
    res.status(200).json(places.length - 1);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
