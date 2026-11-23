import api from './api';

export const groupService = {
  async getGroups(params) {
    const res = await api.get('/groups', { params });
    return res?.data !== undefined ? res.data : res;
  },

  async getGroupById(id) {
    const res = await api.get(`/groups/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  async createGroup(data) {
    const res = await api.post('/groups', data);
    return res?.data !== undefined ? res.data : res;
  },

  async joinGroup(id, inviteCode) {
    const res = await api.post(`/groups/${id}/join`, { inviteCode });
    return res?.data !== undefined ? res.data : res;
  },

  async joinByCode(inviteCode) {
    const res = await api.post('/groups/join-by-code', { inviteCode });
    return res?.data !== undefined ? res.data : res;
  },

  async leaveGroup(id) {
    const res = await api.post(`/groups/${id}/leave`);
    return res?.data !== undefined ? res.data : res;
  },

  async getGroupRides(id) {
    const res = await api.get(`/groups/${id}/rides`);
    return res?.data !== undefined ? res.data : res;
  },
};
