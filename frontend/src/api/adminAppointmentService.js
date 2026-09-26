import axiosClient from './axiosClient.js';

export async function listAppointments({ doctorId, patientId, status, date, search = '', page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (doctorId) params.doctorId = doctorId;
  if (patientId) params.patientId = patientId;
  if (status) params.status = status;
  if (date) params.date = date;
  if (search) params.search = search;
  const response = await axiosClient.get('/appointments', { params });
  return response.data;
}

export async function getAppointment(appointmentId) {
  const response = await axiosClient.get(`/appointments/${appointmentId}`);
  return response.data.appointment;
}

export async function createAppointment(payload) {
  const response = await axiosClient.post('/appointments', payload);
  return response.data.appointment;
}

export async function updateAppointmentStatus(appointmentId, status) {
  const response = await axiosClient.patch(`/appointments/${appointmentId}/status`, { status });
  return response.data.appointment;
}
