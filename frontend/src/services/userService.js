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

  /**
   * Upload Government / Student ID document securely.
   * Can accept a File or FormData object.
   */
  async uploadIdDocument(fileOrFormData, onProgress = null) {
    let payload = fileOrFormData;
    if (fileOrFormData instanceof File) {
      payload = new FormData();
      payload.append('document', fileOrFormData);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress && typeof onProgress === 'function') {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      };
    }

    const res = await api.post('/users/verify/id-document', payload, config);
    return res?.data !== undefined ? res.data : res;
  },

  /**
   * Fetch private ID document access or download blob.
   */
  async getIdDocumentBlob() {
    const res = await api.get('/users/id-document', {
      responseType: 'blob',
    });
    return res;
  },

  /**
   * Remove private ID document and reset verified state.
   */
  async deleteIdDocument() {
    const res = await api.delete('/users/id-document');
    return res?.data !== undefined ? res.data : res;
  },

  /**
   * Request Cloudinary upload signature parameters.
   */
  async getUploadSignature(folder = 'smartride_private/id_documents') {
    const res = await api.get('/upload/sign', { params: { folder } });
    return res?.data !== undefined ? res.data : res;
  },
};
