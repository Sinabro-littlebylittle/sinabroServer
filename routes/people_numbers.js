const express = require('express');
const PeopleNumber = require('../models/people_number');
const { getFormattedDate } = require('../utils/dateUtils');
const router = express.Router();

// :id값에 따른 document 중 placeId값이 :id와 동일한 document 설정 및 조회
const getPlaceInformations = async (req, res, next) => {
  let placeInformations;
  try {
    placeInformations = await PeopleNumber.find({ placeId: req.params.id });
    if (!placeInformations) {
      return res.status(404).json({ message: 'Cannot find place' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.placeInformations = placeInformations;
  next();
};

// 인자로 들어온 배열의 각 요소인 Object에 updateElapsedTime 속성을 기준에 맞게 추가함
const addUpdateElapsedTimeProp = (currPlaceInformations) => {
  // PlaceId 별로 데이터를 그룹화
  const placeIdGroups = {};
  for (const info of currPlaceInformations) {
    const placeIdStr = info.placeId._id.toString();
    if (!placeIdGroups[placeIdStr]) {
      placeIdGroups[placeIdStr] = [];
    }
    placeIdGroups[placeIdStr].push(info);
  }

  // 현재 일자를 가져옴
  const currentTime = new Date();

  // 각 그룹에 대해 가장 최신의 데이터 선택하고 updateElapsedTime 계산
  let updatedPlaceInformations = [];
  for (const placeIdStr in placeIdGroups) {
    const group = placeIdGroups[placeIdStr];
    group.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime)); // 가장 최신 데이터가 앞으로 오게 정렬

    // 최신 데이터만 선택
    const latestInfo = group[0];
    const elapsedTime =
      group.length > 1
        ? Math.floor((currentTime - new Date(group[1].createdTime)) / 1000)
        : -1;

    let updatedInfo = latestInfo.toObject();
    updatedInfo.updateElapsedTime = elapsedTime;
    updatedPlaceInformations.push(updatedInfo);
  }

  // 가장 최신으로 등록된 인원수 데이터의 일자가 배열의 앞으로 오도록 정렬
  updatedPlaceInformations.sort(
    (a, b) => new Date(b.createdTime) - new Date(a.createdTime)
  );

  return updatedPlaceInformations;
};

/**
 * [앱 내 사용 여부 ❌]
 * people_numbers collection 내 모든 document 데이터(들) 반환(Array)
 */
router.get('/', async (req, res) => {
  try {
    const placeInformations = await PeopleNumber.find();
    if (!placeInformations) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.status(200).json(placeInformations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * [앱 내 사용 여부 ✅]
 * places와 marker collection의 참조 document 데이터(들) 반환(Array)
 */
router.get('/public/placeInformations', async (req, res) => {
  try {
    const placeInformations = await PeopleNumber.find()
      .populate({
        path: 'placeId',
        populate: { path: 'markerId' },
      })
      .exec();
    if (!placeInformations) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const updatedPlaceInformations =
      addUpdateElapsedTimeProp(placeInformations);

    res.status(200).json(updatedPlaceInformations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * [앱 내 활용 ❌]
 * :id값과 placeId 필드의 값이 동일한 document 데이터(들) 반환(Array)
 */
router.get('/:id', getPlaceInformations, async (req, res) => {
  const updatedPlaceInformations = addUpdateElapsedTimeProp(
    res.placeInformations
  );
  res.status(200).json(updatedPlaceInformations);
});

/**
 * [앱 내 사용 여부 ✅]
 * :id값과 markerId 필드의 값이 동일한 document에 대해서
 * places와 marker collection의 참조 document 데이터(들) 반환(Array)
 */
router.get('/public/:id/placeInformations', async (req, res) => {
  try {
    const placeInformations = await PeopleNumber.find()
      .populate({
        path: 'placeId',
        populate: { path: 'markerId' },
      })
      .exec();
    if (!placeInformations) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    console.log(placeInformations[0].placeId.markerId._id.toString());
    console.log(req.params.id);

    const filteredPlaceInformations = placeInformations.filter(
      (info) => info.placeId.markerId._id.toString() === req.params.id
    );

    const updatedPlaceInformations = addUpdateElapsedTimeProp(
      filteredPlaceInformations
    );

    res.status(200).json(updatedPlaceInformations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * [앱 내 사용 여부 ✅]
 * 특정 장소에 대한 (인원수 정보)를 DB에 추가
 */
router.post('/private', async (req, res) => {
  if (!req.body.placeId || !req.body.peopleCount) {
    return res.status(400).json({ message: 'Missing required field.' });
  }

  const peopleNumber = new PeopleNumber(req.body);
  peopleNumber.createdTime = getFormattedDate();

  try {
    const newPeopleNumber = await peopleNumber.save();
    res.status(201).json(newPeopleNumber);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
