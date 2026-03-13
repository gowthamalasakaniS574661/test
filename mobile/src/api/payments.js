import apiClient from './client';

export const paymentsAPI = {
  initiatePayment: (data) => apiClient.post('/payments', data),
  getPaymentStatus: (id) => apiClient.get(`/payments/${id}`),
  completePayment: (id) => apiClient.post(`/payments/${id}/complete`),
  getMyPayments: () => apiClient.get('/payments/my'),
};
