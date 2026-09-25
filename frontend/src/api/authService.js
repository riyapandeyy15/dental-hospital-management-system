import axiosClient from './axiosClient.js';

// { token, user }
export async function login(email, password) {
  const response = await axiosClient.post('/auth/login', { email, password });
  return response.data;
}

// { user }
export async function fetchCurrentUser() {
  const response = await axiosClient.get('/auth/me');
  return response.data.user;
}
