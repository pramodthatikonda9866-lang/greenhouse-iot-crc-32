import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const simulationApi = {
  start: (config) => api.post('/api/simulation/start', config),
  stop: () => api.post('/api/simulation/stop'),
  reset: () => api.post('/api/simulation/reset'),
  getCurrent: () => api.get('/api/simulation/current'),
  getRuns: () => api.get('/api/simulation/runs'),
  getRunById: (id) => api.get(`/api/simulation/${id}`)
};

export const sensorApi = {
  getAll: () => api.get('/api/sensors'),
  getById: (id) => api.get(`/api/sensors/${id}`),
  toggle: (id) => api.patch(`/api/sensors/${id}/toggle`)
};

export const packetApi = {
  getPackets: (params) => api.get('/api/packets', { params }),
  testCrc: (data) => api.post('/api/packet/test-crc', data)
};

export const analyticsApi = {
  getSummary: () => api.get('/api/analytics/summary'),
  getSensorsRanking: (params) => api.get('/api/analytics/sensors', { params }),
  getExportUrl: (runId, format = 'json') => `/api/analytics/export/${runId}?format=${format}`
};

export default api;
