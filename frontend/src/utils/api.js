import axios from 'axios';

/**
 * ======================================================
 * API BASE URL
 * ======================================================
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * ======================================================
 * AXIOS INSTANCE
 * ======================================================
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

/**
 * ======================================================
 * REQUEST INTERCEPTOR (FIXED)
 * ======================================================
 */
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';

    // 🔒 ABSOLUTE RULE:
    // NEVER attach Authorization to auth routes
    if (url.includes('/auth/')) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
      return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ======================================================
 * RESPONSE INTERCEPTOR
 * ======================================================
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized – token expired or invalid');
    }
    return Promise.reject(error);
  }
);

/**
 * ======================================================
 * USERS API
 * ======================================================
 */
export const usersAPI = {
  setPreferences: (data) =>
    api.post('/users/preferences', data),

  changePassword: (data) =>
    api.post('/users/change-password', data),
};

/**
 * ======================================================
 * GROUPS API
 * ======================================================
 */
export const groupsAPI = {
  listGroups: (params = {}) =>
    api.get('/groups/list', { params }),

  getTrendingGroups: (params = {}) =>
    api.get('/groups/trending', { params }),

  getTagOptions: () =>
    api.get('/groups/tag-options'),

  createGroup: (data) =>
    api.post('/groups/create', data),

  joinGroup: (groupId) =>
    api.post(`/groups/join/${groupId}`),

  leaveGroup: (groupId) =>
    api.post(`/groups/leave/${groupId}`),

  removeMember: (groupId, memberId) =>
    api.delete(`/groups/${groupId}/members/${memberId}`),

  deleteGroup: (groupId) =>
    api.delete(`/groups/${groupId}`),

  getMyGroups: () =>
    api.get('/groups/my-groups'),

  addResource: (groupId, data) => {
    if (data instanceof FormData) {
      return api.post(`/groups/${groupId}/resources`, data, {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
    }
    return api.post(`/groups/${groupId}/resources`, data);
  },

  getResources: (groupId) =>
    api.get(`/groups/${groupId}/resources`),

  deleteResource: (groupId, resourceId) =>
    api.delete(`/groups/${groupId}/resources/${resourceId}`),

  updateResource: (groupId, resourceId, data) =>
    api.put(`/groups/${groupId}/resources/${resourceId}`, data),

  rateGroup: (groupId, rating) =>
    api.post(`/groups/${groupId}/rate`, { rating }),

  getGroupMessages: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/messages`, { params }),

  sendTextMessage: (groupId, data) =>
    api.post(`/groups/${groupId}/messages/text`, data),

  sendVoiceMessage: (groupId, data) =>
    api.post(`/groups/${groupId}/messages/voice`, data),

  createPoll: (groupId, data) =>
    api.post(`/groups/${groupId}/messages/poll`, data),

  voteInPoll: (groupId, messageId, optionIndex) =>
    api.post(`/groups/${groupId}/messages/${messageId}/vote/${optionIndex}`),

  deleteMessage: (groupId, messageId) =>
    api.delete(`/groups/${groupId}/messages/${messageId}`),
};

/**
 * ======================================================
 * SESSIONS API
 * ======================================================
 */
export const sessionsAPI = {
  getSessions: (params = {}) =>
    api.get('/sessions', { params }),

  createSession: (data) =>
    api.post('/sessions', data),

  getMySessions: () =>
    api.get('/sessions/my'),

  joinSession: (sessionId) =>
    api.post(`/sessions/${sessionId}/join`),

  leaveSession: (sessionId) =>
    api.post(`/sessions/${sessionId}/leave`),

  updateSession: (sessionId, data) =>
    api.put(`/sessions/${sessionId}`, data),

  deleteSession: (sessionId) =>
    api.delete(`/sessions/${sessionId}`),

  completeSession: (sessionId, data) =>
    api.put(`/sessions/${sessionId}/complete`, data),

  addSessionNotes: (sessionId, data) =>
    api.put(`/sessions/${sessionId}/notes`, data),

  addSessionResource: (sessionId, data) =>
    api.post(`/sessions/${sessionId}/resources`, data),
};

/**
 * ======================================================
 * STUDY WITH ME API
 * ======================================================
 */
export const studyWithMeAPI = {
  startSession: (data) =>
    api.post('/study-with-me/start', data),

  endSession: (sessionId, data = {}) =>
    api.put(`/study-with-me/${sessionId}/end`, data),

  getHistory: (params = {}) =>
    api.get('/study-with-me/history', { params }),

  getActiveSession: () =>
    api.get('/study-with-me/active'),

  pauseSession: (sessionId) =>
    api.put(`/study-with-me/${sessionId}/pause`),

  resumeSession: (sessionId) =>
    api.put(`/study-with-me/${sessionId}/resume`),
};

/**
 * ======================================================
 * RECOMMENDATIONS API
 * ======================================================
 */
export const recommendationsAPI = {
  getGroupRecommendations: (params = {}) =>
    api.get('/recommendations/groups', { params }),

  getSessionRecommendations: (params = {}) =>
    api.get('/recommendations/sessions', { params }),

  checkHealth: () =>
    api.get('/recommendations/health'),
};

export default api;