import api from './api';

export const groupService = {
  async getGroups(params) {
    const res = await api.get('/groups', { params });
    return res.data;
  },

  async getGroupById(id) {
    const res = await api.get(`/groups/${id}`);
    return res.data;
  },

  async createGroup(data) {
    const res = await api.post('/groups', data);
    return res.data;
  },

  async joinGroup(id, inviteCode) {
    const res = await api.post(`/groups/${id}/join`, { inviteCode });
    return res.data;
  },

  async joinByCode(inviteCode) {
    const res = await api.post('/groups/join-by-code', { inviteCode });
    return res.data;
  },

  async leaveGroup(id) {
    const res = await api.post(`/groups/${id}/leave`);
    return res.data;
  },

  async getGroupRides(id) {
    const res = await api.get(`/groups/${id}/rides`);
    return res.data;
  },
};
