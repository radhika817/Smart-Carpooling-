import api from './api';

export const reviewService = {
  async createReview(data) {
    const res = await api.post('/reviews', data);
    return res.data;
  },

  async getUserReviews(userId) {
    const res = await api.get(`/reviews/user/${userId}`);
    return res.data;
  },

  async getRideReviews(rideId) {
    const res = await api.get(`/reviews/ride/${rideId}`);
    return res.data;
  },
};
