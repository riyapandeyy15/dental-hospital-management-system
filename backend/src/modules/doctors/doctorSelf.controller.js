const { body, validationResult } = require('express-validator');

const doctorService = require('./doctor.service');

async function getMyProfile(req, res, next) {
  try {
    const doctor = await doctorService.getDoctorByUserId(req.user.id);
    res.status(200).json({ status: 'ok', doctor });
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

    const doctor = await doctorService.updateOwnPhone(req.user.id, req.body.phone);
    res.status(200).json({ status: 'ok', doctor });
  } catch (err) {
    next(err);
  }
}

const updateMyProfileValidators = [
  body('phone').isString().trim().notEmpty().withMessage('Phone number is required.'),
];

module.exports = { getMyProfile, updateMyProfile, updateMyProfileValidators };
