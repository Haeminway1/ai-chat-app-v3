import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthGuard = ({ children }) => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/api-keys" replace />;
  }

  return children;
};

export default AuthGuard;