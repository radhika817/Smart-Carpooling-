import api from './api';

export const analyticsService = {
  async getPersonalAnalytics() {
    const res = await api.get('/analytics/personal');
    return res?.data !== undefined ? res.data : res;
  },

  async getAdminAnalytics() {
    const res = await api.get('/analytics/admin');
    return res?.data !== undefined ? res.data : res;
  },
};
