import axios from 'axios';

/**
 * ======================================================
 * API BASE URL
 * - Uses Vite env in production/dev
 * - Falls back safely for local development
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
 * REQUEST INTERCEPTOR
 * - Automatically attach JWT token if present
 * ======================================================
 */
api.interceptors.request.use(
  (config) => {
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
 * RESPONSE INTERCEPTOR (OPTIONAL BUT PRO)
 * ======================================================
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized error handling (extend later)
    if (error.response?.status === 401) {
      console.warn('Unauthorized – token expired or invalid');
    }
    return Promise.reject(error);
  }
);

/**
 * ======================================================
 * GROUPS API
 * ======================================================
 */
export const groupsAPI = {
  /**
   * Browse public groups
   * GET /api/groups/list
   */
  listGroups: (params = {}) =>
    api.get('/groups/list', { params }),

  /**
   * Create a new group
   * POST /api/groups/create
   */
  createGroup: (data) =>
    api.post('/groups/create', data),

  /**
   * Join a group
   * POST /api/groups/join/:groupId
   */
  joinGroup: (groupId) =>
    api.post(`/groups/join/${groupId}`),

  /**
   * Leave a group
   * POST /api/groups/leave/:groupId
   */
  leaveGroup: (groupId) =>
    api.post(`/groups/leave/${groupId}`),

  /**
   * Get groups joined by logged-in user
   * GET /api/groups/my-groups
   */
  getMyGroups: () =>
    api.get('/groups/my-groups'),

  /**
   * Add resource to group
   * POST /api/groups/:groupId/resources
   */
  addResource: (groupId, data) => {
    // Let the browser/axios set the correct multipart boundary header for FormData.
    // Passing a manual 'Content-Type' without the boundary can break multer parsing.
    if (data instanceof FormData) {
      return api.post(`/groups/${groupId}/resources`, data, {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
    }
    return api.post(`/groups/${groupId}/resources`, data);
  },

  /**
   * Get resources for group
   * GET /api/groups/:groupId/resources
   */
  getResources: (groupId) =>
    api.get(`/groups/${groupId}/resources`),

  /**
   * Delete resource from group
   * DELETE /api/groups/:groupId/resources/:resourceId
   */
  deleteResource: (groupId, resourceId) =>
    api.delete(`/groups/${groupId}/resources/${resourceId}`),

  /**
   * Update resource in group
   * PUT /api/groups/:groupId/resources/:resourceId
   */
  updateResource: (groupId, resourceId, data) =>
    api.put(`/groups/${groupId}/resources/${resourceId}`, data),
};

/**
 * ======================================================
 * SESSIONS API
 * ======================================================
 */
export const sessionsAPI = {
  /**
   * Get all sessions
   * GET /api/sessions
   */
  getSessions: (params = {}) =>
    api.get('/sessions', { params }),

  /**
   * Create a new session
   * POST /api/sessions
   */
  createSession: (data) =>
    api.post('/sessions', data),

  /**
   * Get my sessions
   * GET /api/sessions/my
   */
  getMySessions: () =>
    api.get('/sessions/my'),

  /**
   * Join a session
   * POST /api/sessions/:id/join
   */
  joinSession: (sessionId) =>
    api.post(`/sessions/${sessionId}/join`),

  /**
   * Leave a session
   * POST /api/sessions/:id/leave
   */
  leaveSession: (sessionId) =>
    api.post(`/sessions/${sessionId}/leave`),

  /**
   * Update a session
   * PUT /api/sessions/:id
   */
  updateSession: (sessionId, data) =>
    api.put(`/sessions/${sessionId}`, data),

  /**
   * Delete a session
   * DELETE /api/sessions/:id
   */
  deleteSession: (sessionId) =>
    api.delete(`/sessions/${sessionId}`),

  /**
   * Complete a session
   * PUT /api/sessions/:id/complete
   */
  completeSession: (sessionId, data) =>
    api.put(`/sessions/${sessionId}/complete`, data),

  /**
   * Add notes to a session
   * PUT /api/sessions/:id/notes
   */
  addSessionNotes: (sessionId, data) =>
    api.put(`/sessions/${sessionId}/notes`, data),

  /**
   * Add resource to a session
   * POST /api/sessions/:id/resources
   */
  addSessionResource: (sessionId, data) =>
    api.post(`/sessions/${sessionId}/resources`, data),
};

/**
 * ======================================================
 * STUDY WITH ME API
 * ======================================================
 */
export const studyWithMeAPI = {
  /**
   * Start a new study session
   * POST /api/study-with-me/start
   */
  startSession: (data) =>
    api.post('/study-with-me/start', data),

  /**
   * End a study session
   * PUT /api/study-with-me/:id/end
   */
  endSession: (sessionId, data = {}) =>
    api.put(`/study-with-me/${sessionId}/end`, data),

  /**
   * Get study history
   * GET /api/study-with-me/history
   */
  getHistory: (params = {}) =>
    api.get('/study-with-me/history', { params }),

  /**
   * Get active study session
   * GET /api/study-with-me/active
   */
  getActiveSession: () =>
    api.get('/study-with-me/active'),

  /**
   * Pause study session
   * PUT /api/study-with-me/:id/pause
   */
  pauseSession: (sessionId) =>
    api.put(`/study-with-me/${sessionId}/pause`),

  /**
   * Resume study session
   * PUT /api/study-with-me/:id/resume
   */
  resumeSession: (sessionId) =>
    api.put(`/study-with-me/${sessionId}/resume`),
};

/**
 * ======================================================
 * RECOMMENDATIONS API
 * ======================================================
 */
export const recommendationsAPI = {
  /**
   * Get personalized group recommendations
   * GET /api/recommendations/groups
   */
  getGroupRecommendations: (params = {}) =>
    api.get('/recommendations/groups', { params }),

  /**
   * Get personalized session recommendations
   * GET /api/recommendations/sessions
   */
  getSessionRecommendations: (params = {}) =>
    api.get('/recommendations/sessions', { params }),

  /**
   * Check recommendation service health
   * GET /api/recommendations/health
   */
  checkHealth: () =>
    api.get('/recommendations/health'),
};

export default api;
