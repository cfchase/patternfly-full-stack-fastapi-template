/**
 * Protected route wrapper that requires authentication.
 * Redirects to login page if user is not authenticated.
 */
import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Bullseye } from '@patternfly/react-core';
import { useAuth } from '@contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * Wrapper component that protects routes requiring authentication.
 * Shows loading spinner while checking auth state.
 * Redirects to /login if not authenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" aria-label="Loading authentication status" />
      </Bullseye>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
