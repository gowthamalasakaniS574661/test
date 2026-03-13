import apiClient from './client';

export const bookingsAPI = {
  createBooking: (data) => apiClient.post('/bookings', data),
  getMyBookings: () => apiClient.get('/bookings/my'),
  getBookingById: (id) => apiClient.get(`/bookings/${id}`),
  cancelBooking: (id) => apiClient.post(`/bookings/${id}/cancel`),
  completeBooking: (id) => apiClient.post(`/bookings/${id}/complete`),
};
