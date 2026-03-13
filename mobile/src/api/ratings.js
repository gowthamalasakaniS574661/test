import apiClient from './client';

export const ratingsAPI = {
  createRating: (data) => apiClient.post('/ratings', data),
  getUserRatings: (userId) => apiClient.get(`/ratings/user/${userId}`),
};
