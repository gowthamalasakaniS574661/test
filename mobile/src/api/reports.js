import apiClient from './client';

export const reportsAPI = {
  createReport: (data) => apiClient.post('/reports', data),
  getMyReports: () => apiClient.get('/reports/my'),
};
