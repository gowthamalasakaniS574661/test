import apiClient from './client';

export const safetyAPI = {
  // Driver documents
  uploadDocument: (data) => apiClient.post('/safety/documents', data),
  getMyDocuments: () => apiClient.get('/safety/documents'),
  deleteDocument: (id) => apiClient.delete(`/safety/documents/${id}`),

  // ID verification
  submitIdVerification: (data) => apiClient.post('/safety/verify-id', data),
  getVerificationStatus: () => apiClient.get('/safety/verify-id/status'),

  // SOS
  triggerSOS: (data) => apiClient.post('/safety/sos', data),
  resolveAlert: (id, data) => apiClient.post(`/safety/sos/${id}/resolve`, data),
  getAlertHistory: () => apiClient.get('/safety/sos/history'),

  // Emergency contacts
  setEmergencyContacts: (contacts) => apiClient.put('/safety/emergency-contacts', { contacts }),
  getEmergencyContacts: () => apiClient.get('/safety/emergency-contacts'),

  // Share ride
  createShareLink: (data) => apiClient.post('/safety/share-ride', data),

  // Trip history
  getTripHistory: (params) => apiClient.get('/safety/trip-history', { params }),
};
