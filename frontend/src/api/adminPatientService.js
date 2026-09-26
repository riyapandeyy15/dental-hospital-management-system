import axiosClient from './axiosClient.js';

export async function listPatients({ search = '', status = 'ALL', page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  if (status && status !== 'ALL') params.status = status;
  const response = await axiosClient.get('/patients', { params });
  return response.data;
}

export async function getPatient(patientId) {
  const response = await axiosClient.get(`/patients/${patientId}`);
  return response.data.patient;
}

export async function createPatient(payload) {
  const response = await axiosClient.post('/patients', payload);
  return response.data.patient;
}

export async function updatePatient(patientId, payload) {
  const response = await axiosClient.put(`/patients/${patientId}`, payload);
  return response.data.patient;
}

export async function setPatientStatus(patientId, isActive) {
  const response = await axiosClient.patch(`/patients/${patientId}/status`, { isActive });
  return response.data.patient;
}
