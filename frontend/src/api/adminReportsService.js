import axiosClient from './axiosClient.js';

export async function getDashboard() {
  const response = await axiosClient.get('/admin/dashboard');
  return response.data;
}
