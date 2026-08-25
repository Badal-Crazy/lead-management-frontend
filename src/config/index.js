// ============================================
// MASTER CRM - FRONTEND CONFIGURATION
// ============================================

// Get the current hostname/IP
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

// API Configuration
export const API_BASE_URL = isLocal 
    ? 'http://localhost:8080' 
    : `http://${hostname}:8080`;

export const API_URL = `${API_BASE_URL}/api`;

// Frontend Configuration
export const FRONTEND_URL = window.location.origin;
export const APP_NAME = 'Master CRM';
export const APP_VERSION = '2.0.0';

// Authentication
export const AUTH = {
  tokenKey: 'token',
  userKey: 'user',
  refreshTokenKey: 'refreshToken',
};

// API Endpoints - EXPORT THIS
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    SIGNUP: '/auth/signup',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  // Profile
  PROFILE: {
    GET: '/profile/me',
    UPDATE: '/profile/me',
    CHANGE_PASSWORD: '/profile/change-password',
    AVATAR: '/profile/avatar',
  },
  // Users
  USERS: {
    ALL: '/users/all',
    GET: '/users',
    UPDATE: '/users',
    APPROVE: '/users/approve',
    REJECT: '/users/reject',
    ACTIVATE: '/users/activate',
    DEACTIVATE: '/users/deactivate',
    DELETE: '/users',
  },
  // Admin
  ADMIN: {
    STATS: '/admin/stats',
    RECENT_ACTIVITY: '/admin/recent-activity',
    PENDING_USERS: '/admin/pending-users',
    APPROVE_USER: '/admin/approve-user',
    REJECT_USER: '/admin/approve-user',
    USERS: '/admin/users',
    DELETE_USER: '/admin/users',
    TOGGLE_USER: '/admin/users/toggle',
    CHANGE_PASSWORD: '/admin/users/password',
  },
  // Leads
  LEADS: {
    GET: '/leads',
    CREATE: '/leads',
    UPDATE: '/leads',
    DELETE: '/leads',
    SEARCH: '/leads/search',
    UPLOAD: '/leads/upload',
    UPLOAD_PROGRESS: '/leads/upload/progress',
    UPLOAD_STATUS: '/leads/upload/status',
    BULK_DELETE: '/leads/bulk',
    DELETE_BY_UPLOAD: '/leads/upload',
  },
  // Dispositions
  DISPOSITIONS: {
    GET: '/dispositions',
    CREATE: '/dispositions',
    ALL: '/dispositions/all',
    DOWNLOAD: '/dispositions/download',
  },
  // Dashboard
  DASHBOARD: {
    AGENT: '/dashboard/agent',
    ADMIN: '/dashboard/admin',
    SUPER_ADMIN: '/dashboard/super-admin',
  },
  // Reports
  REPORTS: {
    AGENT_PERFORMANCE: '/reports/agent-performance',
    ADMIN_PERFORMANCE: '/reports/admin-performance',
    TEAM_PERFORMANCE: '/reports/team-performance',
    LEAD_STATUS: '/reports/lead-status',
    DISPOSITION_SUMMARY: '/reports/disposition-summary',
    ALLOCATION_SUMMARY: '/reports/allocation-summary',
    LOGIN_LOGOUT: '/reports/login-logout',
    DATE_WISE: '/reports/date-wise',
    EXPORT: '/reports/export',
  },
  // Upload
  UPLOAD: {
    LEADS: '/uploads/leads',
    PROGRESS: '/uploads/progress',
    STATUS: '/uploads/status',
    RESULT: '/uploads/result',
    ERRORS: '/uploads/errors',
    CANCEL: '/uploads/cancel',
    HISTORY: '/uploads/history',
  },
};

// Default Values
export const DEFAULTS = {
  pageSize: 10,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  uploadTimeout: 600000, // 10 minutes
  apiTimeout: 30000, // 30 seconds
};

// Feature Flags
export const FEATURES = {
  enableFileUpload: true,
  enableBulkDelete: true,
  enableReports: true,
  enableUserManagement: true,
  enableTeamManagement: true,
};

export default {
  API_BASE_URL,
  API_URL,
  FRONTEND_URL,
  APP_NAME,
  APP_VERSION,
  AUTH,
  ENDPOINTS,
  DEFAULTS,
  FEATURES,
};
