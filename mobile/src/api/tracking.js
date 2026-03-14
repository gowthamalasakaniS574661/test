import apiClient from './client';

export const trackingAPI = {
  updateDriverLocation: (bookingId, location) =>
    apiClient.post(`/bookings/${bookingId}/location`, {
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading,
      speed: location.speed,
    }),

  getDriverLocation: (bookingId) =>
    apiClient.get(`/bookings/${bookingId}/location`),

  startRide: (bookingId) =>
    apiClient.post(`/bookings/${bookingId}/start`),

  completeRide: (bookingId) =>
    apiClient.post(`/bookings/${bookingId}/complete`),

  getRouteDirections: (origin, destination) =>
    apiClient.get('/directions', {
      params: {
        originLat: origin.latitude,
        originLng: origin.longitude,
        destLat: destination.latitude,
        destLng: destination.longitude,
      },
    }),
};
