import api from './api';

export const vehicleService = {
  async getVehicles() {
    const res = await api.get('/vehicles');
    return res.data;
  },

  async createVehicle(data) {
    const res = await api.post('/vehicles', data);
    return res.data;
  },

  async updateVehicle(id, data) {
    const res = await api.put(`/vehicles/${id}`, data);
    return res.data;
  },

  async deleteVehicle(id) {
    const res = await api.delete(`/vehicles/${id}`);
    return res;
  },
};
