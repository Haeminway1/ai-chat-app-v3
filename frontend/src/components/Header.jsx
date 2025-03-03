import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    // No title for chat page
    const path = location.pathname;
    if (path.startsWith('/chat')) return '';
    if (path === '/settings') return '';
    if (path === '/api-keys') return 'API Keys';
    return 'AI Chat App';
  };

  const title = getPageTitle();

  // Don't render header on chat page or settings page
  if (location.pathname.startsWith('/chat') || location.pathname.startsWith('/settings')) {
    return null;
  }

  return (
    <header className="app-header">
      {title && (
        <div className="header-title">
          <h1>{title}</h1>
        </div>
      )}
    </header>
  );
};

export default Header;
