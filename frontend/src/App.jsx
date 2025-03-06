import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import LoopPage from './pages/LoopPage';
import SettingsPage from './pages/SettingsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { LoopProvider } from './contexts/LoopContext';
import { ModelProvider } from './contexts/ModelContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';

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
    return <Navigate to="/api-keys" replace state={{ from: location.pathname }} />;
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

// Settings route that preserves chat context
const SettingsRoute = () => {
  const location = useLocation();
  const from = location.state?.from || '/chat';
  
  return <SettingsPage returnPath={from} />;
};

function AppContent() {
  const [loading, setLoading] = useState(true);
  const { authenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to load, then remove loading screen after a short delay
    if (!authLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

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
        {/* Home route redirects to chats for authenticated users or api-keys for non-authenticated */}
        <Route index element={
          authenticated ? <Navigate to="/chat" replace /> : <Navigate to="/api-keys" replace />
        } />
        
        {/* Chat routes */}
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
        
        {/* Loop routes */}
        <Route path="loop" element={
          <ProtectedRoute>
            <LoopPage />
          </ProtectedRoute>
        } />
        
        <Route path="loop/:loopId" element={
          <ProtectedRoute>
            <LoopPage />
          </ProtectedRoute>
        } />
        
        {/* Settings route */}
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsRoute />
          </ProtectedRoute>
        } />
        
        {/* API keys route */}
        <Route path="api-keys" element={<ApiKeysRoute />} />
        
        {/* Catch-all route for invalid URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ModelProvider>
            <ChatProvider>
              <LoopProvider>
                <AppContent />
              </LoopProvider>
            </ChatProvider>
          </ModelProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;