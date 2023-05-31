const express = require('express');
const PeopleNumber = require('../models/people_number');
const { getFormattedDate } = require('../utils/dateUtils');
const router = express.Router();

// people_numbers collection 내 모든 document 데이터(들) 반환(Array)
router.get('/', async (req, res) => {
  try {
    const placeInfos = await PeopleNumber.find();
    if (!placeInfos) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.status(200).json(placeInfos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// people_numbers와 places collection의 참조 document 데이터(들) 반환(Array)
router.get('/placeInformations', async (req, res) => {
  try {
    const placeInformations = await PeopleNumber.find()
      .populate('placeId')
      .exec();
    if (!placeInformations) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // PlaceId 별로 데이터를 그룹화
    const placeIdGroups = {};
    for (const info of placeInformations) {
      const placeIdStr = info.placeId._id.toString();
      if (!placeIdGroups[placeIdStr]) {
        placeIdGroups[placeIdStr] = [];
      }
      placeIdGroups[placeIdStr].push(info);
    }

    // 현재 일자를 가져옴
    const currentTime = new Date();

    // 각 그룹에 대해 updateElapsedTime 계산
    let updatedPlaceInformations = [];
    for (const placeIdStr in placeIdGroups) {
      const group = placeIdGroups[placeIdStr];
      group.sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime)); // 정렬: 최신 일자가 뒤로

      const elapsedTime =
        group.length > 1
          ? Math.floor(
              (currentTime - new Date(group[group.length - 1].createdTime)) /
                1000
            )
          : -1;

      for (const info of group) {
        let updatedInfo = info.toObject();
        updatedInfo.updateElapsedTime = elapsedTime;
        updatedPlaceInformations.push(updatedInfo);
      }
    }

    res.status(200).json(updatedPlaceInformations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 특정 장소에 대한 (인원수 정보)를 DB에 추가
router.post('/', async (req, res) => {
  if (!req.body.placeId || !req.body.peopleCount) {
    return res.status(400).json({ message: 'Missing required field.' });
  }

  const peopleNumber = new PeopleNumber({
    placeId: req.body.placeId,
    peopleCount: req.body.peopleCount,
    createdTime: getFormattedDate,
  });

  try {
    const newPeopleNumber = await peopleNumber.save();
    res.status(201).json(newPeopleNumber);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
