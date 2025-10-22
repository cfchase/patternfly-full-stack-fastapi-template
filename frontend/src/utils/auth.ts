/**
 * Authentication utilities for token management and storage.
 */

const TOKEN_KEY = 'access_token';

/**
 * Store access token in localStorage.
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get access token from localStorage.
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove access token from localStorage.
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated (has a valid token).
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();

    if (isExpired) {
      removeToken();
      return false;
    }

    return true;
  } catch (error) {
    // Invalid token format
    removeToken();
    return false;
  }
};

/**
 * Get user ID from token payload.
 */
export const getUserIdFromToken = (): string | null => {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch (error) {
    return null;
  }
};
