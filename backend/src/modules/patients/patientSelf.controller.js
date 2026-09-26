const { body, validationResult } = require('express-validator');

const patientSelfService = require('./patientSelf.service');

async function getMyProfile(req, res, next) {
  try {
    const patient = await patientSelfService.getMyProfile(req.user.id);
    res.status(200).json({ status: 'ok', patient });
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const patient = await patientSelfService.updateMyProfile(req.user.id, req.body);
    res.status(200).json({ status: 'ok', patient });
  } catch (err) {
    next(err);
  }
}

const updateMyProfileValidators = [
  body('name').optional().isString().trim().notEmpty(),
  body('phone').optional().isString().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('gender').optional().isIn(['male', 'female', 'other']),
];

module.exports = { getMyProfile, updateMyProfile, updateMyProfileValidators };
