import axiosClient from './axiosClient.js';

// --- Dashboard ---
export async function getDashboard() {
  const response = await axiosClient.get('/doctor/dashboard');
  return response.data;
}

// --- Profile ---
export async function getMyProfile() {
  const response = await axiosClient.get('/doctor/profile');
  return response.data.doctor;
}

export async function updateMyProfile(payload) {
  const response = await axiosClient.put('/doctor/profile', payload);
  return response.data.doctor;
}

export async function updateMyAvailability(availability) {
  const response = await axiosClient.put('/doctor/profile/availability', { availability });
  return response.data.doctor;
}

// --- Patients ---
export async function listPatients({ search = '', page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  const response = await axiosClient.get('/doctor/patients', { params });
  return response.data;
}

export async function getPatient(patientId) {
  const response = await axiosClient.get(`/doctor/patients/${patientId}`);
  return response.data.patient;
}

// --- Appointments ---
export async function listAppointments({ when, status, patientId, search = '', page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (when) params.when = when;
  if (status) params.status = status;
  if (patientId) params.patientId = patientId;
  if (search) params.search = search;
  const response = await axiosClient.get('/doctor/appointments', { params });
  return response.data;
}

export async function updateAppointmentStatus(appointmentId, status) {
  const response = await axiosClient.patch(`/doctor/appointments/${appointmentId}/status`, { status });
  return response.data.appointment;
}

// --- Dental records ---
export async function listRecords(patientId) {
  const response = await axiosClient.get(`/doctor/patients/${patientId}/records`);
  return response.data.records;
}

export async function createRecord(patientId, payload) {
  const response = await axiosClient.post(`/doctor/patients/${patientId}/records`, payload);
  return response.data.record;
}

// --- Treatments ---
export async function listTreatments(patientId) {
  const response = await axiosClient.get(`/doctor/patients/${patientId}/treatments`);
  return response.data.treatments;
}

export async function createTreatment(patientId, payload) {
  const response = await axiosClient.post(`/doctor/patients/${patientId}/treatments`, payload);
  return response.data.treatment;
}

// --- Prescriptions ---
export async function listPrescriptions(patientId) {
  const response = await axiosClient.get(`/doctor/patients/${patientId}/prescriptions`);
  return response.data.prescriptions;
}

export async function createPrescription(patientId, payload) {
  const response = await axiosClient.post(`/doctor/patients/${patientId}/prescriptions`, payload);
  return response.data.prescription;
}
