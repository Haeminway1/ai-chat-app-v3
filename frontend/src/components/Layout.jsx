import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navigation from './Navigation';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { authenticated } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Don't show sidebar on API keys page
  const showSidebar = authenticated && location.pathname !== '/api-keys';
  
  // Don't show navigation on API keys page
  const showNavigation = authenticated && location.pathname !== '/api-keys';

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="app-layout">
      {showSidebar && <Sidebar onToggle={handleSidebarToggle} />}
      {showNavigation && <Navigation />}
      <div className={`main-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;