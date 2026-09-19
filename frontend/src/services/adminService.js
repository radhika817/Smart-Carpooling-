import api from './api';

export const adminService = {
  async getOverview() {
    const res = await api.get('/admin/overview');
    return res.data;
  },

  async getUsers(params) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  async updateUserStatus(id, data) {
    const res = await api.patch(`/admin/users/${id}/status`, data);
    return res.data;
  },

  async updateUserRole(id, role) {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  async updateUserVerification(id, verificationStatus) {
    const res = await api.patch(`/admin/users/${id}/verification`, { verificationStatus });
    return res.data;
  },

  async getRides(params) {
    const res = await api.get('/admin/rides', { params });
    return res.data;
  },

  async cancelRide(id, reason) {
    const res = await api.post(`/admin/rides/${id}/cancel`, { reason });
    return res.data;
  },

  async getSosAlerts(params) {
    const res = await api.get('/admin/sos-alerts', { params });
    return res.data;
  },

  async resolveSosAlert(id, resolutionNotes) {
    const res = await api.patch(`/admin/sos-alerts/${id}/resolve`, { resolutionNotes });
    return res.data;
  },
};
