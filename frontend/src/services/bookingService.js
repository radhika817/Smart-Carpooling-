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

  async markAsPaid(id) {
    const res = await api.patch(`/bookings/${id}/mark-paid`);
    return res.data;
  },

  async getDriverBookings() {
    const res = await api.get('/bookings/driver');
    return res.data;
  },
};
