/**
 * Axios client configured with authentication interceptors.
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from '../utils/auth';

// Base URL from environment variable or default to current origin
const baseURL = import.meta.env.VITE_API_URL || '';

/**
 * Create axios instance with base configuration.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add authentication token to requests.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle authentication errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // If we get a 401, the token is invalid - remove it
    if (error.response?.status === 401) {
      removeToken();
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
