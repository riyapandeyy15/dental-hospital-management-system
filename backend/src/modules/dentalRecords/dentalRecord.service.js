const mongoose = require('mongoose');

const DentalRecord = require('../../models/DentalRecord');
const ApiError = require('../../utils/apiError');
const { ensureDoctorHasPatientAccess } = require('../../utils/doctorPatientAccess');

function toSafeRecord(record) {
  return {
    id: record._id.toString(),
    patientId: record.patientId?.toString(),
    doctorId: record.doctorId?.toString(),
    appointmentId: record.appointmentId ? record.appointmentId.toString() : null,
    visitDate: record.visitDate,
    chiefComplaint: record.chiefComplaint || null,
    clinicalNotes: record.clinicalNotes || null,
    diagnosis: record.diagnosis || null,
    followUp: record.followUp || null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// Any doctor with a real appointment relationship to the patient can view
// the patient's full record history (shared clinical chart), but may only
// edit entries they personally authored.
async function listRecordsForPatient(doctorId, patientId) {
  await ensureDoctorHasPatientAccess(doctorId, patientId);

  const records = await DentalRecord.find({ patientId }).sort({ visitDate: -1 }).lean();
  return records.map(toSafeRecord);
}

async function createRecord(doctorId, patientId, payload) {
  await ensureDoctorHasPatientAccess(doctorId, patientId);

  const { chiefComplaint, clinicalNotes, diagnosis, appointmentId, followUp } = payload;

  if (appointmentId && !mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new ApiError(400, 'Invalid appointment ID.');
  }

  const record = await DentalRecord.create({
    patientId,
    doctorId,
    appointmentId: appointmentId || undefined,
    chiefComplaint: chiefComplaint?.trim() || undefined,
    clinicalNotes: clinicalNotes?.trim() || undefined,
    diagnosis: diagnosis?.trim() || undefined,
    followUp: followUp
      ? {
          required: Boolean(followUp.required),
          date: followUp.date || undefined,
          notes: followUp.notes?.trim() || undefined,
        }
      : undefined,
  });

  return toSafeRecord(record.toObject());
}

async function updateRecord(doctorId, recordId, payload) {
  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    throw new ApiError(400, 'Invalid record ID.');
  }

  const record = await DentalRecord.findById(recordId);
  if (!record) {
    throw new ApiError(404, 'Dental record not found.');
  }
  if (record.doctorId.toString() !== doctorId) {
    throw new ApiError(403, 'You can only edit dental records you authored.');
  }

  const { chiefComplaint, clinicalNotes, diagnosis, followUp } = payload;

  if (chiefComplaint !== undefined) record.chiefComplaint = chiefComplaint.trim();
  if (clinicalNotes !== undefined) record.clinicalNotes = clinicalNotes.trim();
  if (diagnosis !== undefined) record.diagnosis = diagnosis.trim();
  if (followUp !== undefined) {
    record.followUp = {
      required: Boolean(followUp.required),
      date: followUp.date || undefined,
      notes: followUp.notes?.trim() || undefined,
    };
  }

  await record.save();
  return toSafeRecord(record.toObject());
}

module.exports = { listRecordsForPatient, createRecord, updateRecord, toSafeRecord };
