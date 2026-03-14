import apiClient from './client';

export const paymentsAPI = {
  createPaymentIntent: (bookingId) =>
    apiClient.post('/payments/create-intent', { bookingId }),

  confirmEscrow: (paymentId) =>
    apiClient.post('/payments/confirm-escrow', { paymentId }),

  capturePayment: (paymentId) =>
    apiClient.post(`/payments/${paymentId}/capture`),

  refundPayment: (paymentId) =>
    apiClient.post(`/payments/${paymentId}/refund`),

  getPaymentStatus: (id) =>
    apiClient.get(`/payments/${id}`),

  getPaymentByBooking: (bookingId) =>
    apiClient.get(`/payments/booking/${bookingId}`),

  getMyPayments: () =>
    apiClient.get('/payments/my'),

  createConnectAccount: (data) =>
    apiClient.post('/payments/connect/account', data),

  getConnectAccountStatus: () =>
    apiClient.get('/payments/connect/status'),

  getConnectDashboardLink: () =>
    apiClient.get('/payments/connect/dashboard'),
};
