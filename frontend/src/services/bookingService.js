import api from './api';

export const bookingService = {
  async getMyBookings() {
    const res = await api.get('/bookings');
    return res.data;
  },

  async acceptBooking(id) {
    const res = await api.post(`/bookings/${id}/accept`);
    return res.data;
  },

  async rejectBooking(id) {
    const res = await api.post(`/bookings/${id}/reject`);
    return res.data;
  },

  async cancelBooking(id) {
    const res = await api.post(`/bookings/${id}/cancel`);
    return res.data;
  },
};
