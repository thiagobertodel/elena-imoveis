import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('elena_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('elena_token');
        localStorage.removeItem('elena_user');
        // Redirecionar para login se não estiver na página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// =============================================
// AUTH
// =============================================

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  exportMyData: () => api.get('/auth/my-data'),
  deleteAccount: () => api.delete('/auth/account'),
};

// =============================================
// PROPERTIES
// =============================================

export const propertiesAPI = {
  list: (params) => api.get('/properties', { params }),
  getFeatured: () => api.get('/properties/featured'),
  getCities: () => api.get('/properties/cities'),
  getById: (id) => api.get(`/properties/${id}`),
  getMyProperties: () => api.get('/properties/user/my'),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
};

// =============================================
// UPLOAD
// =============================================

export const uploadAPI = {
  uploadImages: (propertyId, formData) =>
    api.post(`/upload/${propertyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (imageId) => api.delete(`/upload/${imageId}`),
  setCover: (imageId) => api.put(`/upload/${imageId}/cover`),
};

// =============================================
// ADMIN
// =============================================

export const adminAPI = {
  listPending: (params) => api.get('/admin/properties', { params }),
  approve: (id) => api.put(`/admin/properties/${id}/approve`),
  reject: (id) => api.put(`/admin/properties/${id}/reject`),
  toggleFeature: (id) => api.put(`/admin/properties/${id}/feature`),
  getStats: () => api.get('/admin/stats'),
  listUsers: () => api.get('/admin/users'),
};

export default api;
