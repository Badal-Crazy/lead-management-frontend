// src/api/index.js
import axios from 'axios';
import { API_URL, AUTH, ENDPOINTS, DEFAULTS } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: DEFAULTS.apiTimeout || 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH.tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH.tokenKey);
      localStorage.removeItem(AUTH.userKey);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 1. Authentication APIs
export const authApi = {
  login: (data) => api.post(ENDPOINTS.AUTH.LOGIN, data),
  logout: () => api.post(ENDPOINTS.AUTH.LOGOUT),
  signup: (data) => api.post(ENDPOINTS.AUTH.SIGNUP, data),
  refreshToken: () => api.post(ENDPOINTS.AUTH.REFRESH_TOKEN),
  forgotPassword: (email) => api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (data) => api.post(ENDPOINTS.AUTH.RESET_PASSWORD, data),
};

// 2. Profile APIs
export const profileApi = {
  getProfile: () => api.get(ENDPOINTS.PROFILE.GET),
  updateProfile: (data) => api.put(ENDPOINTS.PROFILE.UPDATE, data),
  changePassword: (data) => api.put(ENDPOINTS.PROFILE.CHANGE_PASSWORD, data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(ENDPOINTS.PROFILE.AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// 3. User Management APIs
export const userApi = {
  getUsers: () => api.get(ENDPOINTS.USERS.GET),
  getUser: (userId) => api.get(`${ENDPOINTS.USERS.GET}/${userId}`),
  updateUser: (userId, data) => api.put(`${ENDPOINTS.USERS.UPDATE}/${userId}`, data),
  approveUser: (userId) => api.post(`${ENDPOINTS.USERS.APPROVE}/${userId}`),
  rejectUser: (userId) => api.post(`${ENDPOINTS.USERS.REJECT}/${userId}`),
  activateUser: (userId) => api.post(`${ENDPOINTS.USERS.ACTIVATE}/${userId}`),
  deactivateUser: (userId) => api.post(`${ENDPOINTS.USERS.DEACTIVATE}/${userId}`),
  getAllUsers: () => api.get(ENDPOINTS.USERS.ALL),
  createUser: (data) => api.post(ENDPOINTS.USERS.GET, data),
  deleteUser: (userId) => api.delete(`${ENDPOINTS.USERS.DELETE}/${userId}`),
  updateUserRole: (userId, role) => api.put(`${ENDPOINTS.USERS.UPDATE}/${userId}/role`, { role }),
  assignAdmin: (userId, adminId) => api.put(`${ENDPOINTS.USERS.UPDATE}/${userId}/admin`, { adminId }),
  assignTeam: (userId, teamId) => api.put(`${ENDPOINTS.USERS.UPDATE}/${userId}/team`, { teamId }),
  getAgents: () => api.get('/users/agents'),
  getAgentDetails: (agentId) => api.get(`/users/agents/${agentId}`),
};

// 4. Role Management APIs
export const roleApi = {
  getRoles: () => api.get(ENDPOINTS.ROLES?.GET || '/roles'),
  createRole: (data) => api.post(ENDPOINTS.ROLES?.CREATE || '/roles', data),
  updateRole: (roleId, data) => api.put(`${ENDPOINTS.ROLES?.UPDATE || '/roles'}/${roleId}`, data),
  deleteRole: (roleId) => api.delete(`${ENDPOINTS.ROLES?.DELETE || '/roles'}/${roleId}`),
};

// 5. Team Management APIs
export const teamApi = {
  getTeams: () => api.get(ENDPOINTS.TEAMS?.GET || '/teams'),
  createTeam: (data) => api.post(ENDPOINTS.TEAMS?.CREATE || '/teams', data),
  getTeam: (teamId) => api.get(`${ENDPOINTS.TEAMS?.GET || '/teams'}/${teamId}`),
  updateTeam: (teamId, data) => api.put(`${ENDPOINTS.TEAMS?.UPDATE || '/teams'}/${teamId}`, data),
  deleteTeam: (teamId) => api.delete(`${ENDPOINTS.TEAMS?.DELETE || '/teams'}/${teamId}`),
  addUserToTeam: (teamId, userId) => api.post(`${ENDPOINTS.TEAMS?.GET || '/teams'}/${teamId}/users`, { userId }),
  removeUserFromTeam: (teamId, userId) => api.delete(`${ENDPOINTS.TEAMS?.GET || '/teams'}/${teamId}/users/${userId}`),
  getTeamUsers: (teamId) => api.get(`${ENDPOINTS.TEAMS?.GET || '/teams'}/${teamId}/users`),
};

// 6. Admin APIs
export const adminApi = {
  getStats: () => api.get(ENDPOINTS.ADMIN.STATS),
  getRecentActivity: () => api.get(ENDPOINTS.ADMIN.RECENT_ACTIVITY),
  getPendingUsers: () => api.get(ENDPOINTS.ADMIN.PENDING_USERS),
  approveUser: (username) => api.post(`${ENDPOINTS.ADMIN.APPROVE_USER}/${username}`, { action: 'approve' }),
  rejectUser: (username) => api.post(`${ENDPOINTS.ADMIN.REJECT_USER}/${username}`, { action: 'reject' }),
  getAllUsers: () => api.get(ENDPOINTS.ADMIN.USERS),
  createUser: (data) => api.post(ENDPOINTS.ADMIN.USERS, data),
  updateUserRole: (username, role) => api.put(`${ENDPOINTS.ADMIN.USERS}/${username}/role`, { role }),
  toggleUser: (username, enabled) => api.put(`${ENDPOINTS.ADMIN.TOGGLE_USER}/${username}`, { enabled }),
  deleteUser: (username) => {
    const userData = localStorage.getItem(AUTH.userKey);
    let userRole = 'ROLE_AGENT';
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        userRole = parsed.role || 'ROLE_AGENT';
      } catch (e) {}
    }
    return api.delete(`${ENDPOINTS.ADMIN.DELETE_USER}/${username}`, {
      headers: { 'X-User-Role': userRole }
    });
  },
  changePassword: (username, password) => api.put(`${ENDPOINTS.ADMIN.CHANGE_PASSWORD}/${username}`, { password }),
};

// 7. Lead APIs
export const leadApi = {
  getLeads: () => api.get(ENDPOINTS.LEADS.GET),
  getLead: (leadId) => api.get(`${ENDPOINTS.LEADS.GET}/${leadId}`),
  createLead: (data) => api.post(ENDPOINTS.LEADS.CREATE, data),
  updateLead: (leadId, data) => api.put(`${ENDPOINTS.LEADS.UPDATE}/${leadId}`, data),
  deleteLead: (leadId) => api.delete(`${ENDPOINTS.LEADS.DELETE}/${leadId}`),
  searchLeads: (query, type) => api.get(ENDPOINTS.LEADS.SEARCH, { params: { q: query, type } }),
  uploadLeads: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(ENDPOINTS.LEADS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  getUploadProgress: (uploadId) => api.get(`${ENDPOINTS.LEADS.UPLOAD_PROGRESS}/${uploadId}`),
  getUploadStatus: (uploadId) => api.get(`${ENDPOINTS.LEADS.UPLOAD_STATUS}/${uploadId}`),
  bulkDeleteLeads: (leadIds) => api.delete(ENDPOINTS.LEADS.BULK_DELETE, { data: { leadIds } }),
  deleteLeadsByUploadName: (uploadName) => api.delete(`${ENDPOINTS.LEADS.DELETE_BY_UPLOAD}/${uploadName}`),
  getMyAllocation: () => api.get('/leads/my-allocation'),
  getAgentLeads: (agentId) => api.get(`/leads/agent/${agentId}`),
  getLeadsByAgent: () => api.get('/leads/agent'),
  getAgentDashboard: (month) => api.get(`/leads/agent/dashboard?month=${month}`),
  updateLeadStatus: (leadId, status) => api.put(`/leads/${leadId}/status`, { status }),
  updatePTPStatus: (leadId, ptpStatus) => api.put(`/leads/${leadId}/ptp`, { ptpStatus }),
  addFollowUp: (leadId, data) => api.post(`/leads/${leadId}/followup`, data),
  getDashboardStats: () => api.get('/leads/agent/stats'),
  getTodayTasks: () => api.get('/leads/agent/tasks/today'),
  getUpcomingPTPs: () => api.get('/leads/agent/ptp/upcoming'),
  getBPTP: () => api.get('/leads/agent/ptp/broken'),
  getRecentActivities: () => api.get('/leads/agent/activities/recent'),
};

// 8. Disposition APIs
export const dispositionApi = {
  createDisposition: (data) => api.post(ENDPOINTS.DISPOSITIONS.CREATE, data),
  getAllDispositions: () => api.get(ENDPOINTS.DISPOSITIONS.ALL),
  downloadDispositions: (startDate, endDate) => 
    api.get(ENDPOINTS.DISPOSITIONS.DOWNLOAD, {
      params: { startDate, endDate },
      responseType: 'blob',
    }),
  getDispositions: () => api.get('/dispositions'),
  getDispositionById: (id) => api.get(`/dispositions/${id}`),
  updateDisposition: (id, data) => api.put(`/dispositions/${id}`, data),
  getDispositionsByAgent: (agentId) => api.get(`/dispositions/agent/${agentId}`),
  getDispositionsByLead: (leadId) => api.get(`/dispositions/lead/${leadId}`),
  getDispositionsByAgreement: (agreementNumber) => api.get(`/dispositions/agreement/${agreementNumber}`),
};

// 9. Dashboard APIs
export const dashboardApi = {
  getAgentDashboard: (agentId) => {
    const params = agentId ? { agentId } : {};
    return api.get('/dashboard/agent', { params });
  },
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getSuperAdminDashboard: () => api.get('/dashboard/super-admin'),
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// 10. Reports APIs
export const reportsApi = {
  getAgentPerformance: (params) => api.get(ENDPOINTS.REPORTS.AGENT_PERFORMANCE, { params }),
  getAdminPerformance: (params) => api.get(ENDPOINTS.REPORTS.ADMIN_PERFORMANCE, { params }),
  getTeamPerformance: (params) => api.get(ENDPOINTS.REPORTS.TEAM_PERFORMANCE, { params }),
  getLeadStatus: (params) => api.get(ENDPOINTS.REPORTS.LEAD_STATUS, { params }),
  getDispositionSummary: (params) => api.get(ENDPOINTS.REPORTS.DISPOSITION_SUMMARY, { params }),
  getAllocationSummary: (params) => api.get(ENDPOINTS.REPORTS.ALLOCATION_SUMMARY, { params }),
  getLoginLogout: (params) => api.get(ENDPOINTS.REPORTS.LOGIN_LOGOUT, { params }),
  getDateWiseReport: (params) => api.get(ENDPOINTS.REPORTS.DATE_WISE, { params }),
  exportReport: (params) => api.get(ENDPOINTS.REPORTS.EXPORT, { params, responseType: 'blob' }),
};

// 11. Upload APIs
export const uploadApi = {
  uploadLeads: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(ENDPOINTS.UPLOAD.LEADS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  getUploadProgress: (uploadId) => api.get(`${ENDPOINTS.UPLOAD.PROGRESS}/${uploadId}`),
  getUploadStatus: (uploadId) => api.get(`${ENDPOINTS.UPLOAD.STATUS}/${uploadId}`),
  getUploadResult: (uploadId) => api.get(`${ENDPOINTS.UPLOAD.RESULT}/${uploadId}`),
  getUploadErrors: (uploadId) => api.get(`${ENDPOINTS.UPLOAD.ERRORS}/${uploadId}`),
  cancelUpload: (uploadId) => api.post(`${ENDPOINTS.UPLOAD.CANCEL}/${uploadId}`),
  getUploadHistory: () => api.get(ENDPOINTS.UPLOAD.HISTORY),
};

export default api;