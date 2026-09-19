import api from './api';

export const safetyService = {
  async triggerSos(rideId, data = {}) {
    const res = await api.post(`/rides/${rideId}/sos`, data);
    return res.data;
  },

  async generateShareLink(rideId, durationHours = 4) {
    const res = await api.post(`/rides/${rideId}/share-link`, { durationHours });
    return res.data;
  },

  async getPublicTracking(shareToken) {
    const res = await api.get(`/rides/track/${shareToken}`);
    return res.data;
  },
};
