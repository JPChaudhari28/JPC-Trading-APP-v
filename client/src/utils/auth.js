// JWT Token Management Utilities

const TOKEN_KEY = 'jpc_trading_token';
const USER_KEY = 'jpc_trading_user';

export const authUtils = {
  // Store token and user data
  setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Get stored token
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get stored user data
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (err) {
      return false;
    }
  },

  // Get token expiration time
  getTokenExpiration() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (err) {
      return null;
    }
  },

  // Check if token expires soon (within 1 hour)
  isTokenExpiringSoon() {
    const exp = this.getTokenExpiration();
    if (!exp) return true;
    
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    return (exp.getTime() - Date.now()) < oneHour;
  },

  // Clear authentication data
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Get authorization header
  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : '';
  }
};

// Auto-refresh token when it's about to expire
export const setupTokenRefresh = (api) => {
  const checkAndRefresh = async () => {
    if (authUtils.isAuthenticated() && authUtils.isTokenExpiringSoon()) {
      try {
        const response = await api.post('/api/auth/refresh');
        authUtils.setAuth(response.data.token, response.data.user);
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        authUtils.clearAuth();
        window.location.href = '/login';
      }
    }
  };

  // Check every 5 minutes
  setInterval(checkAndRefresh, 5 * 60 * 1000);
  
  // Check immediately
  checkAndRefresh();
};