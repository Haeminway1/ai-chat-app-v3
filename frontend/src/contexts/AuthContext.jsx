import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkAuth, getApiKeys, saveApiKeys } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyStatus, setKeyStatus] = useState({
    openai: false,
    anthropic: false,
    google: false
  });

  const checkAuthentication = async () => {
    setLoading(true);
    try {
      const result = await checkAuth();
      setAuthenticated(result.authenticated);
      
      // Get API key status
      const keys = await getApiKeys();
      setKeyStatus(keys);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const saveKeys = async (keys) => {
    try {
      const result = await saveApiKeys(keys);
      await checkAuthentication();
      return result;
    } catch (error) {
      console.error('Failed to save API keys:', error);
      throw error; // Re-throw to be handled by the form
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const value = {
    authenticated,
    loading,
    keyStatus,
    checkAuthentication,
    saveKeys
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};