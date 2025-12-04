import axios from "axios";
import { authUtils, setupTokenRefresh } from "./utils/auth.js";

// Base URL points to backend API (with /api)
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // send cookies if using session auth
  headers: {
    "Content-Type": "application/json",
  },
});

// --------------------
// Request interceptor: attach auth token
// --------------------
api.interceptors.request.use(
  (config) => {
    const token = authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// --------------------
// Response interceptor: handle 401 & token expiration
// --------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error (backend not running / CORS / offline)
      console.error("Network error:", error);
      return Promise.reject({ message: "Network error", original: error });
    }

    const { status, data } = error.response;

    if (status === 401) {
      const code = data?.code;
      if (code === "TOKEN_EXPIRED") {
        console.warn("Token expired. Logging out...");
        authUtils.clearAuth();
        window.location.href = "/login";
      }
    }

    console.error("API response error:", error.response);
    return Promise.reject(error);
  }
);

// --------------------
// Optional: auto token refresh (if implemented in auth.js)
// --------------------
setupTokenRefresh(api);
