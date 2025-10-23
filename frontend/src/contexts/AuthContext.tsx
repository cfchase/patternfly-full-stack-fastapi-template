/**
 * Authentication context for managing user authentication state.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserPublic } from '@api/auth';
import { getCurrentUser } from '@api/users';
import { login as apiLogin, register as apiRegister, RegisterRequest } from '@api/auth';
import { setToken, removeToken, isAuthenticated as checkAuth } from '@utils/auth';

interface AuthContextType {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component.
 * Wraps the app and provides authentication state and methods.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch current user from API.
   */
  const fetchCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // If fetching user fails, remove the token
      removeToken();
      setUser(null);
    }
  };

  /**
   * Initialize authentication state on mount.
   */
  useEffect(() => {
    const initAuth = async () => {
      if (checkAuth()) {
        await fetchCurrentUser();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login with email and password.
   */
  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiLogin(email, password);
    setToken(response.access_token);
    await fetchCurrentUser();
  };

  /**
   * Logout and clear authentication state.
   */
  const logout = (): void => {
    removeToken();
    setUser(null);
  };

  /**
   * Register a new user account.
   */
  const register = async (data: RegisterRequest): Promise<void> => {
    await apiRegister(data);
    // After registration, automatically log in
    await login(data.email, data.password);
  };

  /**
   * Refresh current user data.
   */
  const refreshUser = async (): Promise<void> => {
    if (checkAuth()) {
      await fetchCurrentUser();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context.
 * Must be used within AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
