import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  return (
    <div className="navigation">
      <button 
        className={`nav-button ${currentPath.startsWith('/chat') ? 'active' : ''}`}
        onClick={() => handleNavigation('/chat')}
        title="Chat"
      >
        💬
      </button>
      <button 
        className={`nav-button ${currentPath.startsWith('/loop') ? 'active' : ''}`}
        onClick={() => handleNavigation('/loop')}
        title="AI Loop"
      >
        🔄
      </button>
      <button 
        className={`nav-button ${currentPath === '/settings' ? 'active' : ''}`}
        onClick={() => handleNavigation('/settings', { state: { from: location.pathname } })}
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  );
};

export default Navigation;