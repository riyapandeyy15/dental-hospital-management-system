import axiosClient from './axiosClient.js';

// { status, doctors, pagination, stats }
export async function listDoctors({ search = '', status = 'ALL', page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  if (status && status !== 'ALL') params.status = status;

  const response = await axiosClient.get('/doctors', { params });
  return response.data;
}

export async function getDoctor(id) {
  const response = await axiosClient.get(`/doctors/${id}`);
  return response.data.doctor;
}

export async function createDoctor(payload) {
  const response = await axiosClient.post('/doctors', payload);
  return response.data.doctor;
}

export async function updateDoctor(id, payload) {
  const response = await axiosClient.put(`/doctors/${id}`, payload);
  return response.data.doctor;
}

export async function setDoctorStatus(id, isActive) {
  const response = await axiosClient.patch(`/doctors/${id}/status`, { isActive });
  return response.data.doctor;
}
