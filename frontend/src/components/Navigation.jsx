import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check if current path matches route (accounting for sub-routes)
  const isActive = (route) => {
    if (route === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(route);
  };
  
  return (
    <div className="navigation">
      <div className="nav-container">
        <button 
          className={`nav-button ${isActive('/chat') ? 'active' : ''}`}
          onClick={() => navigate('/chat')}
          aria-label="Chat"
        >
          <span className="nav-label">Chat</span>
        </button>
        
        <button 
          className={`nav-button ${isActive('/loop') ? 'active' : ''}`}
          onClick={() => navigate('/loop')}
          aria-label="Loop"
        >
          <span className="nav-label">Loop</span>
        </button>
        
        <button 
          className={`nav-button ${isActive('/settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          <span className="nav-label">Settings</span>
        </button>
        
        {/* Space for future navigation items */}
      </div>
    </div>
  );
};

export default Navigation;