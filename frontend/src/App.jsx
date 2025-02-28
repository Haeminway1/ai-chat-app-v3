import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ModelProvider } from './contexts/ModelContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AuthGuard from './components/AuthGuard';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
    <AuthProvider>
      <SettingsProvider>
        <ModelProvider>
          <ChatProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/chat" replace />} />
                <Route path="chat" element={
                  <AuthGuard>
                    <ChatPage />
                  </AuthGuard>
                } />
                <Route path="chat/:chatId" element={
                  <AuthGuard>
                    <ChatPage />
                  </AuthGuard>
                } />
                <Route path="settings" element={
                  <AuthGuard>
                    <SettingsPage />
                  </AuthGuard>
                } />
                <Route path="api-keys" element={<ApiKeysPage />} />
              </Route>
            </Routes>
          </ChatProvider>
        </ModelProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;