import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthGuard = ({ children }) => {
  const { authenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Checking authentication...</div>;
  }

  // If not authenticated and not already on the API keys page
  if (!authenticated && location.pathname !== '/api-keys') {
    return <Navigate to="/api-keys" replace />;
  }

  return children;
};

export default AuthGuard;