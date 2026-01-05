import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =========================
     INITIAL AUTH CHECK
  ========================= */
  useEffect(() => {
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = async () => {
    const storedToken = localStorage.getItem('token');

    // 🔑 No token → force logged-out state
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.data?.success && res.data?.data?.user) {
        const verifiedUser = {
          id: res.data.data.user.id || res.data.data.user._id,
          email: res.data.data.user.email,
          username: res.data.data.user.username,
          preferences: res.data.data.user.preferences || { interests: [] },
          onboarding: res.data.data.user.onboarding || { completed: false },
          joinedGroups: res.data.data.user.joinedGroups || [],
          attendedSessions: res.data.data.user.attendedSessions || [],
          activityScore: res.data.data.user.activityScore || 0,
        };

        setUser(verifiedUser);
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      // 🔥 Invalid / expired token → logout
      logout();
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGIN
  ========================= */
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (res.data?.success && res.data?.data?.token) {
        const { token: newToken, user: userData } = res.data.data;

        const normalizedUser = {
          id: userData.id || userData._id,
          email: userData.email,
          username: userData.username,
          preferences: userData.preferences || { interests: [] },
          onboarding: userData.onboarding || { completed: false },
          joinedGroups: userData.joinedGroups || [],
          attendedSessions: userData.attendedSessions || [],
          activityScore: userData.activityScore || 0,
        };

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(normalizedUser);
        setIsAuthenticated(true);

        return { success: true };
      }

      return { success: false, error: 'Invalid login response' };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          'Login failed',
      };
    }
  };

  /* =========================
     REGISTER
  ========================= */
  const register = async (userData) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        userData
      );

      if (res.data?.success) {
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error?.message ||
          'Registration failed',
      };
    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  /* =========================
     UPDATE PROFILE
  ========================= */
  const updateProfile = async (updates) => {
    // optimistic local update
    const newUser = { ...(user || {}), ...updates };
    setUser(newUser);

    const storedToken = localStorage.getItem('token');
    if (!storedToken) return { success: true };

    try {
      const res = await axios.patch(
        `${API_BASE_URL}/api/users/${newUser.id || newUser._id}`,
        updates,
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      if (res.data?.success && res.data.data?.user) {
        const normalizedUser = {
          id: res.data.data.user.id || res.data.data.user._id,
          email: res.data.data.user.email,
          username: res.data.data.user.username,
          preferences: res.data.data.user.preferences || user?.preferences || { interests: [] },
          onboarding: res.data.data.user.onboarding || user?.onboarding || { completed: false },
          joinedGroups: res.data.data.user.joinedGroups || user?.joinedGroups || [],
          attendedSessions: res.data.data.user.attendedSessions || user?.attendedSessions || [],
          activityScore: res.data.data.user.activityScore || user?.activityScore || 0,
        };
        setUser(normalizedUser);
        return { success: true };
      }

      return { success: false };
    } catch (err) {
      // ignore backend failure; keep optimistic update
      return { success: false, error: err?.response?.data || err.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    verifyToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
