import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  changePassword: (passwords) => api.put('/auth/change-password', passwords)
};

// Employee APIs
export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`)
};

// Attendance APIs
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  getByUser: (userId, params) => api.get(`/attendance/user/${userId}`, { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
  getToday: () => api.get('/attendance/today')
};

// Leave APIs
export const leaveAPI = {
  apply: (data) => api.post('/leaves', data),
  getByUser: (userId, params) => api.get(`/leaves/user/${userId}`, { params }),
  getPending: () => api.get('/leaves/pending'),
  approve: (id, data) => api.put(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.put(`/leaves/${id}/reject`, data),
  getBalance: (userId) => api.get(`/leaves/balance/${userId}`)
};

// Payroll APIs
export const payrollAPI = {
  calculate: (data) => api.post('/payroll/calculate', data),
  getByEmployee: (id, params) => api.get(`/payroll/employee/${id}`, { params }),
  generate: (data) => api.post('/payroll/generate', data),
  update: (id, data) => api.put(`/payroll/${id}`, data),
  getMonthly: (month, year) => api.get(`/payroll/monthly/${month}/${year}`)
};

// Performance APIs
export const performanceAPI = {
  createEvaluation: (data) => api.post('/performance/evaluation', data),
  getByEmployee: (id) => api.get(`/performance/employee/${id}`),
  getById: (id) => api.get(`/performance/${id}`),
  update: (id, data) => api.put(`/performance/${id}`, data),
  acknowledge: (id, data) => api.put(`/performance/${id}/acknowledge`, data),
  getPending: () => api.get('/performance/pending/all'),
  getAnalytics: (employeeId) => api.get(`/performance/analytics/${employeeId}`)
};

// Recruitment APIs
export const recruitmentAPI = {
  createJob: (data) => api.post('/recruitment/jobs', data),
  getAllJobs: (params) => api.get('/recruitment/jobs', { params }),
  getJobById: (id) => api.get(`/recruitment/jobs/${id}`),
  updateJob: (id, data) => api.put(`/recruitment/jobs/${id}`, data),
  submitApplication: (data) => api.post('/recruitment/applications', data),
  getApplications: (jobId, params) => api.get(`/recruitment/applications/${jobId}`, { params }),
  updateApplication: (jobId, applicationId, data) => 
    api.put(`/recruitment/applications/${jobId}/${applicationId}`, data),
  scheduleInterview: (jobId, applicationId, data) => 
    api.post(`/recruitment/applications/${jobId}/${applicationId}/interview`, data)
};

export default api;
