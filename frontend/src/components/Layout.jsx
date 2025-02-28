import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { authenticated } = useAuth();
  const location = useLocation();
  
  // Don't show sidebar on API keys page
  const showSidebar = authenticated && location.pathname !== '/api-keys';

  return (
    <div className="app-layout">
      {showSidebar && <Sidebar />}
      <div className="main-container">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;