import api from './api';

export const authService = {
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  googleLogin: async (googlePayload = {}) => {
    return await api.post('/auth/google', googlePayload);
  },

  githubLogin: async (githubPayload = {}) => {
    return await api.post('/auth/github', githubPayload);
  },

  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  updateProfile: async (profileData) => {
    return await api.put('/auth/profile', profileData);
  },

  demoLogin: async () => {
    return await api.post('/auth/demo');
  },
};

export default authService;
