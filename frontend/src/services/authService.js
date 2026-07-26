import api from './api';

export const login = (credentials) => api.post('/auth/login', credentials).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
export const registerUser = (userData) => api.post('/auth/register', userData).then((r) => r.data);
