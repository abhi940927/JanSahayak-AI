import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Supabase Token or Demo Role
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jansahayak_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Demo role header support for testing environment
  const demoRole = localStorage.getItem('jansahayak_demo_role');
  if (demoRole) {
    config.headers['x-demo-role'] = demoRole;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Format error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
