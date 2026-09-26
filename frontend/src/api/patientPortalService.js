import axiosClient from './axiosClient.js';

export async function getDashboard() {
  const response = await axiosClient.get('/patient/dashboard');
  return response.data;
}

export async function getMyProfile() {
  const response = await axiosClient.get('/patient/profile');
  return response.data.patient;
}

export async function updateMyProfile(payload) {
  const response = await axiosClient.put('/patient/profile', payload);
  return response.data.patient;
}

export async function listMyAppointments({ when, page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (when) params.when = when;
  const response = await axiosClient.get('/patient/appointments', { params });
  return response.data;
}

export async function getMyAppointment(appointmentId) {
  const response = await axiosClient.get(`/patient/appointments/${appointmentId}`);
  return response.data.appointment;
}

export async function bookAppointment({ doctorId, appointmentDate, startTime, reason }) {
  const response = await axiosClient.post('/patient/appointments', { doctorId, appointmentDate, startTime, reason });
  return response.data.appointment;
}

export async function cancelMyAppointment(appointmentId) {
  const response = await axiosClient.patch(`/patient/appointments/${appointmentId}/cancel`);
  return response.data.appointment;
}
