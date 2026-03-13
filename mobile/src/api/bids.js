import apiClient from './client';

export const bidsAPI = {
  createBid: (data) => apiClient.post('/bids', data),
  getMyBids: () => apiClient.get('/bids/my'),
  respondToBid: (id, action) => apiClient.post(`/bids/${id}/respond`, { action }),
  withdrawBid: (id) => apiClient.post(`/bids/${id}/withdraw`),
};
