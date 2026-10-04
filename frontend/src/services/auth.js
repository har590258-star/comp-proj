import api from './api';

export const authService = {
  async login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  async forgotPassword(username) {
    const res = await api.post('/auth/forgot-password', { username });
    return res.data;
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me');
    return res.data;
  }
};
