import apiClient from './client';

export const trustScoreAPI = {
  getMyTrustScore: () => apiClient.get('/trust-score/me'),
  getUserTrustScore: (userId) => apiClient.get(`/trust-score/${userId}`),
  recalculate: () => apiClient.post('/trust-score/recalculate'),
};
