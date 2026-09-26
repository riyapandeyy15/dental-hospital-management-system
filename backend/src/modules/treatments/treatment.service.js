const mongoose = require('mongoose');

const Treatment = require('../../models/Treatment');
const DentalRecord = require('../../models/DentalRecord');
const ApiError = require('../../utils/apiError');
const { ensureDoctorHasPatientAccess } = require('../../utils/doctorPatientAccess');

function toSafeTreatment(treatment) {
  return {
    id: treatment._id.toString(),
    dentalRecordId: treatment.dentalRecordId?.toString(),
    patientId: treatment.patientId?.toString(),
    doctorId: treatment.doctorId?.toString(),
    procedureName: treatment.procedureName,
    toothNumber: treatment.toothNumber || null,
    description: treatment.description || null,
    status: treatment.status,
    performedDate: treatment.performedDate || null,
    cost: treatment.cost ?? null,
    createdAt: treatment.createdAt,
    updatedAt: treatment.updatedAt,
  };
}

async function listTreatmentsForPatient(doctorId, patientId) {
  await ensureDoctorHasPatientAccess(doctorId, patientId);
  const treatments = await Treatment.find({ patientId }).sort({ createdAt: -1 }).lean();
  return treatments.map(toSafeTreatment);
}

async function createTreatment(doctorId, patientId, payload) {
  await ensureDoctorHasPatientAccess(doctorId, patientId);

  const { dentalRecordId, procedureName, toothNumber, description, status, performedDate, cost } = payload;

  if (!dentalRecordId || !mongoose.Types.ObjectId.isValid(dentalRecordId)) {
    throw new ApiError(400, 'A valid dentalRecordId is required.');
  }
  if (!procedureName || !procedureName.trim()) {
    throw new ApiError(400, 'procedureName is required.');
  }

  const record = await DentalRecord.findOne({ _id: dentalRecordId, patientId });
  if (!record) {
    throw new ApiError(400, 'The dental record does not belong to this patient.');
  }

  const treatment = await Treatment.create({
    dentalRecordId,
    patientId,
    doctorId,
    procedureName: procedureName.trim(),
    toothNumber: toothNumber?.trim() || undefined,
    description: description?.trim() || undefined,
    status: status || undefined,
    performedDate: performedDate || undefined,
    cost: cost !== undefined && cost !== '' ? Number(cost) : undefined,
  });

  return toSafeTreatment(treatment.toObject());
}

async function updateTreatment(doctorId, treatmentId, payload) {
  if (!mongoose.Types.ObjectId.isValid(treatmentId)) {
    throw new ApiError(400, 'Invalid treatment ID.');
  }

  const treatment = await Treatment.findById(treatmentId);
  if (!treatment) {
    throw new ApiError(404, 'Treatment not found.');
  }
  if (treatment.doctorId.toString() !== doctorId) {
    throw new ApiError(403, 'You can only edit treatments you created.');
  }

  const { procedureName, toothNumber, description, status, performedDate, cost } = payload;

  if (procedureName !== undefined) treatment.procedureName = procedureName.trim();
  if (toothNumber !== undefined) treatment.toothNumber = toothNumber.trim();
  if (description !== undefined) treatment.description = description.trim();
  if (status !== undefined) treatment.status = status;
  if (performedDate !== undefined) treatment.performedDate = performedDate || undefined;
  if (cost !== undefined) treatment.cost = cost === '' ? undefined : Number(cost);

  await treatment.save();
  return toSafeTreatment(treatment.toObject());
}

module.exports = { listTreatmentsForPatient, createTreatment, updateTreatment, toSafeTreatment };
