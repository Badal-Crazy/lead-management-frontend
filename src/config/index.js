// ============================================
// MASTER CRM - FRONTEND CONFIGURATION
// CHANGE ALL SETTINGS HERE - ONE PLACE ONLY
// ============================================

// ---------- API Configuration ----------
// Change these values to update everywhere
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_URL = `${API_BASE_URL}/api`;

// ---------- Frontend Configuration ----------
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
export const APP_NAME = 'Master CRM';
export const APP_VERSION = '2.0.0';

// ---------- Authentication ----------
export const AUTH = {
  tokenKey: 'token',
  userKey: 'user',
  refreshTokenKey: 'refreshToken',
};

// ---------- API Endpoints (All endpoints in one place) ----------
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
};

// ---------- Default Values ----------
export const DEFAULTS = {
  pageSize: 10,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  uploadTimeout: 600000, // 10 minutes
  apiTimeout: 30000, // 30 seconds
};

// ---------- Feature Flags ----------
export const FEATURES = {
  enableFileUpload: true,
  enableBulkDelete: true,
  enableReports: true,
  enableUserManagement: true,
  enableTeamManagement: true,
};

// ---------- Export all as default ----------
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
