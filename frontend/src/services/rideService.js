import api from './api';

export const rideService = {
  async searchRides(params) {
    const res = await api.get('/rides/search', { params });
    return res.data;
  },

  async getRides(params) {
    const res = await api.get('/rides', { params });
    return res.data;
  },

  async getRideById(id) {
    const res = await api.get(`/rides/${id}`);
    return res.data;
  },

  async createRide(data) {
    const res = await api.post('/rides', data);
    return res.data;
  },

  async updateRide(id, data) {
    const res = await api.put(`/rides/${id}`, data);
    return res.data;
  },

  async cancelRide(id) {
    const res = await api.delete(`/rides/${id}`);
    return res;
  },

  async startRide(id) {
    const res = await api.post(`/rides/${id}/start`);
    return res.data;
  },

  async completeRide(id) {
    const res = await api.post(`/rides/${id}/complete`);
    return res.data;
  },

  async bookSeat(rideId, data) {
    const res = await api.post(`/rides/${rideId}/book`, data);
    return res.data;
  },

  async calculateCostSplit(data) {
    const res = await api.post('/rides/cost-split', data);
    return res.data;
  },

  async suggestPickup(data) {
    const res = await api.post('/rides/suggest-pickup', data);
    return res.data;
  },

  async getRideMessages(rideId) {
    const res = await api.get(`/rides/${rideId}/messages`);
    return res.data;
  },

  async updateRideStatus(rideId, status, message) {
    const res = await api.post(`/rides/${rideId}/status`, { status, message });
    return res.data;
  },
};
