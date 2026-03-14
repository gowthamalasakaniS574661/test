import apiClient from './client';

export const adsAPI = {
  getAds: (placement, lat, lng) =>
    apiClient.get('/ads', { params: { placement, lat, lng } }),
  recordClick: (id) => apiClient.post(`/ads/${id}/click`),
};
