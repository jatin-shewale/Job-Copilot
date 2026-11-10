import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('jc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jc_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
};

export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  uploadResume: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return API.post('/users/upload-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const jobsAPI = {
  search: (data) => API.post('/jobs/search', data),
  getLatest: (query, location, limit) => API.get(`/jobs/latest?query=${query}&location=${location || ''}&limit=${limit || 30}`),
};

export const analysisAPI = {
  fullAnalysis: (data) => API.post('/analysis/full', data),
  predict: (data) => API.post('/analysis/predict', data),
};

export const atsAPI = {
  analyze: (data) => API.post('/ats/analyze', data),
  optimize: (data) => API.post('/ats/optimize', data),
};

export const coverLetterAPI = {
  generate: (data) => API.post('/cover-letter/generate', data),
};

export const coldEmailAPI = {
  generate: (data) => API.post('/cold-email/generate', data),
  companyResearch: (data) => API.post('/cold-email/company-research', data),
};

export const skillGapAPI = {
  analyze: (data) => API.post('/skill-gap/analyze', data),
};

export const resumeAPI = {
  rewrite: (data) => API.post('/resume/rewrite', data),
  linkedin: (data) => API.post('/resume/linkedin', data),
};

export const recommendationsAPI = {
  careerRoadmap: (data) => API.post('/recommendations/career-roadmap', data),
  interviewPrep: (data) => API.post('/recommendations/interview-prep', data),
};

export default API;
