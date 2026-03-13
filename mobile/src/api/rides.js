import apiClient from './client';

export const ridesAPI = {
  getRides: (params) => apiClient.get('/rides', { params }),
  getRideById: (id) => apiClient.get(`/rides/${id}`),
  createRide: (data) => apiClient.post('/rides', data),
  updateRide: (id, data) => apiClient.put(`/rides/${id}`, data),
  cancelRide: (id) => apiClient.post(`/rides/${id}/cancel`),
  getMyRides: () => apiClient.get('/rides/my'),
};

export const rideRequestsAPI = {
  getRideRequests: (params) => apiClient.get('/ride-requests', { params }),
  getRideRequestById: (id) => apiClient.get(`/ride-requests/${id}`),
  createRideRequest: (data) => apiClient.post('/ride-requests', data),
  getMyRequests: () => apiClient.get('/ride-requests/my'),
  cancelRequest: (id) => apiClient.post(`/ride-requests/${id}/cancel`),
};
