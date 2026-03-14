import apiClient from './client';

export const matchingAPI = {
  getRankedDrivers: (requestId) => apiClient.get(`/matching/rank/${requestId}`),
  getNearbyRides: (lat, lng, radius, filters) =>
    apiClient.get('/matching/nearby', { params: { lat, lng, radius, ...filters } }),
};
