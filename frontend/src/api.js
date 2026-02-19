import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  
  register: (userData) =>
    api.post('/auth/register', userData),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Patient API
export const patientAPI = {
  getAll: () =>
    api.get('/patients'),
  
  getById: (id) =>
    api.get(`/patients/${id}`),
  
  create: (patientData) =>
    api.post('/patients', patientData),
  
  search: (query) =>
    api.get(`/patients/search?q=${query}`),
};

// Prediction API
export const predictionAPI = {
  predict: (formData) =>
    api.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.risk) params.append('risk', filters.risk);
    if (filters.date) params.append('date', filters.date);
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);
    return api.get(`/predictions?${params.toString()}`);
  },
  
  getById: (id) =>
    api.get(`/predictions/${id}`),
  
  downloadReport: (id) =>
    api.get(`/prediction/${id}/report`, {
      responseType: 'blob',
    }),
};

// Statistics API
export const statisticsAPI = {
  getStats: () =>
    api.get('/statistics'),
};

// Model Performance API
export const modelAPI = {
  getPerformance: () =>
    api.get('/model/performance'),
  
  compare: () =>
    api.get('/model/compare'),
};

// Patient Trends API
export const trendsAPI = {
  getPatientTrends: (patientId) =>
    api.get(`/patient/${patientId}/trends`),
};

export default api;
