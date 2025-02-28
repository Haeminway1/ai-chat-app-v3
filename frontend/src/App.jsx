import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ModelProvider } from './contexts/ModelContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Custom route component that handles authentication
const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();
  const location = useLocation();
  
  // If still loading auth state, show loading indicator
  if (loading) {
    return <div className="loading">Checking authentication...</div>;
  }
  
  // If not authenticated and not on the API keys page, redirect to API keys
  if (!authenticated && location.pathname !== '/api-keys') {
    return <Navigate to="/api-keys" replace />;
  }
  
  // Either authenticated or already on the API keys page
  return children;
};

// Wrapper around API keys page to avoid auth redirects
const ApiKeysRoute = () => {
  const { authenticated } = useAuth();
  const location = useLocation();
  
  // If authenticated and trying to access API keys without a specific reason
  // redirect to chat (unless coming from a redirect)
  if (authenticated && !location.state?.from) {
    return <Navigate to="/chat" replace />;
  }
  
  return <ApiKeysPage />;
};

function AppContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading AI Chat App...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/chat" replace />} />
        
        <Route path="chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        
        <Route path="chat/:chatId" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="api-keys" element={<ApiKeysRoute />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ModelProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </ModelProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;