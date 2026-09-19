import api from './api';

export const userService = {
  async getProfile(userId = null) {
    const endpoint = userId ? `/users/${userId}` : '/users/profile';
    const res = await api.get(endpoint);
    return res?.data !== undefined ? res.data : res;
  },

  async getEmergencyContacts() {
    const res = await api.get('/users/emergency-contacts');
    return res?.data !== undefined ? res.data : res;
  },

  async addEmergencyContact(contact) {
    const res = await api.post('/users/emergency-contacts', contact);
    return res?.data !== undefined ? res.data : res;
  },

  async deleteEmergencyContact(contactId) {
    const res = await api.delete(`/users/emergency-contacts/${contactId}`);
    return res?.data !== undefined ? res.data : res;
  },

  async updateVerification(data) {
    const res = await api.post('/users/verify', data);
    return res?.data !== undefined ? res.data : res;
  },
};
