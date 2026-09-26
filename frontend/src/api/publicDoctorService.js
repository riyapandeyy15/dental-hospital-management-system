import axiosClient from './axiosClient.js';

// Public endpoints - no auth required, safe to call before login/registration.

export async function listPublicDoctors({ search = '', specialization = '', page = 1, limit = 12 } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  if (specialization) params.specialization = specialization;
  const response = await axiosClient.get('/doctors/public', { params });
  return response.data;
}

export async function getPublicDoctor(doctorId) {
  const response = await axiosClient.get(`/doctors/public/${doctorId}`);
  return response.data.doctor;
}

// { date, slots: [{ startTime, endTime, status }] }
export async function getDoctorAvailability(doctorId, dateStr) {
  const response = await axiosClient.get(`/doctors/public/${doctorId}/availability`, { params: { date: dateStr } });
  return response.data;
}
