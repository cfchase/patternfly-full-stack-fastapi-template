/**
 * Tests for authentication utilities.
 */
import { setToken, getToken, removeToken, isAuthenticated, getUserIdFromToken } from './auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Auth Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Token Storage', () => {
    test('should store token in localStorage', () => {
      const token = 'test-token-123';
      setToken(token);
      expect(localStorage.getItem('access_token')).toBe(token);
    });

    test('should retrieve token from localStorage', () => {
      const token = 'test-token-456';
      localStorage.setItem('access_token', token);
      expect(getToken()).toBe(token);
    });

    test('should return null when token does not exist', () => {
      expect(getToken()).toBeNull();
    });

    test('should remove token from localStorage', () => {
      const token = 'test-token-789';
      localStorage.setItem('access_token', token);
      removeToken();
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('should return false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    test('should return true for valid non-expired token', () => {
      // Create a token that expires in 1 hour
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { sub: 'user123', exp: futureTimestamp };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      setToken(token);
      expect(isAuthenticated()).toBe(true);
    });

    test('should return false for expired token', () => {
      // Create a token that expired 1 hour ago
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
      const payload = { sub: 'user123', exp: pastTimestamp };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      setToken(token);
      expect(isAuthenticated()).toBe(false);
      // Should also remove the expired token
      expect(getToken()).toBeNull();
    });

    test('should return false for invalid token format', () => {
      setToken('invalid-token-format');
      expect(isAuthenticated()).toBe(false);
      // Should remove the invalid token
      expect(getToken()).toBeNull();
    });

    test('should return false for token with invalid JSON payload', () => {
      const token = 'header.invalid-json.signature';
      setToken(token);
      expect(isAuthenticated()).toBe(false);
      // Should remove the invalid token
      expect(getToken()).toBeNull();
    });
  });

  describe('getUserIdFromToken', () => {
    test('should extract user ID from valid token', () => {
      const userId = 'user-123-456';
      const payload = { sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      setToken(token);
      expect(getUserIdFromToken()).toBe(userId);
    });

    test('should return null when no token exists', () => {
      expect(getUserIdFromToken()).toBeNull();
    });

    test('should return null for invalid token format', () => {
      setToken('invalid-token');
      expect(getUserIdFromToken()).toBeNull();
    });

    test('should return null for token without sub claim', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;

      setToken(token);
      expect(getUserIdFromToken()).toBeNull();
    });
  });
});
