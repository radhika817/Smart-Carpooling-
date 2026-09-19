import api from './api';

export const authService = {
  async register(userData) {
    const res = await api.post('/auth/register', userData);
    return res;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clean up even if network error
    } finally {
      localStorage.removeItem('smartride_token');
      localStorage.removeItem('smartride_user');
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res;
  },
};
