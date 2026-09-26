const mongoose = require('mongoose');

const Prescription = require('../../models/Prescription');
const DentalRecord = require('../../models/DentalRecord');
const ApiError = require('../../utils/apiError');
const { ensureDoctorHasPatientAccess } = require('../../utils/doctorPatientAccess');

function toSafePrescription(prescription) {
  return {
    id: prescription._id.toString(),
    dentalRecordId: prescription.dentalRecordId?.toString(),
    patientId: prescription.patientId?.toString(),
    doctorId: prescription.doctorId?.toString(),
    medicines: prescription.medicines || [],
    issuedDate: prescription.issuedDate,
    createdAt: prescription.createdAt,
  };
}

async function listPrescriptionsForPatient(doctorId, patientId) {
  await ensureDoctorHasPatientAccess(doctorId, patientId);
  const prescriptions = await Prescription.find({ patientId }).sort({ issuedDate: -1 }).lean();
  return prescriptions.map(toSafePrescription);
}

// Prescriptions are create-only, matching real clinical practice - an
// issued prescription is a historical document, not something a doctor
// portal should allow silently editing after the fact.
async function createPrescription(doctorId, patientId, payload) {
  await ensureDoctorHasPatientAccess(doctorId, patientId);

  const { dentalRecordId, medicines } = payload;

  if (!dentalRecordId || !mongoose.Types.ObjectId.isValid(dentalRecordId)) {
    throw new ApiError(400, 'A valid dentalRecordId is required.');
  }
  if (!Array.isArray(medicines) || medicines.length === 0) {
    throw new ApiError(400, 'At least one medicine is required.');
  }
  for (const medicine of medicines) {
    if (!medicine.name?.trim() || !medicine.dosage?.trim() || !medicine.frequency?.trim()) {
      throw new ApiError(400, 'Each medicine needs a name, dosage and frequency.');
    }
  }

  const record = await DentalRecord.findOne({ _id: dentalRecordId, patientId });
  if (!record) {
    throw new ApiError(400, 'The dental record does not belong to this patient.');
  }

  const prescription = await Prescription.create({
    dentalRecordId,
    patientId,
    doctorId,
    medicines: medicines.map((m) => ({
      name: m.name.trim(),
      dosage: m.dosage.trim(),
      frequency: m.frequency.trim(),
      durationDays: m.durationDays !== undefined && m.durationDays !== '' ? Number(m.durationDays) : undefined,
      instructions: m.instructions?.trim() || undefined,
    })),
  });

  return toSafePrescription(prescription.toObject());
}

module.exports = { listPrescriptionsForPatient, createPrescription, toSafePrescription };
