const { validationResult } = require('express-validator');

const doctorService = require('./doctor.service');

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    return false;
  }
  return true;
}

async function list(req, res, next) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await doctorService.listDoctors({ search, status, page, limit });
    res.status(200).json({ status: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.status(200).json({ status: 'ok', doctor });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const doctor = await doctorService.createDoctor(req.body);
    res.status(201).json({ status: 'ok', doctor });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const doctor = await doctorService.updateDoctor(req.params.id, req.body);
    res.status(200).json({ status: 'ok', doctor });
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const doctor = await doctorService.setDoctorStatus(req.params.id, req.body.isActive);
    res.status(200).json({ status: 'ok', doctor });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, setStatus };
