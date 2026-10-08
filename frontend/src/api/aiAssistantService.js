import axiosClient from './axiosClient.js';

// `history` is this session's own in-memory chat turns ([{role, content}]) -
// never persisted, and the backend re-trims it server-side regardless of
// what's sent here.
export async function sendMessage({ message, history = [] }) {
  const response = await axiosClient.post('/ai/chat', { message, history });
  return response.data.data.message;
}
