import api from './api';

export const getLeads = (params) => api.get('/leads', { params }).then((r) => r.data);
export const getLead = (id) => api.get(`/leads/${id}`).then((r) => r.data);
export const createLead = (data) => api.post('/leads', data).then((r) => r.data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data).then((r) => r.data);
export const deleteLead = (id) => api.delete(`/leads/${id}`).then((r) => r.data);
export const getDashboard = () => api.get('/leads/dashboard').then((r) => r.data);
export const addNote = (data) => api.post('/notes', data).then((r) => r.data);
export const getActivity = (params) => api.get('/activity', { params }).then((r) => r.data);
