import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
  const { user, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if user needs onboarding (only if authenticated and onboarding not completed)
  if (isAuthenticated && user && !user?.onboarding?.completed) {
    return <Navigate to="/onboarding/interests" replace />;
  }

  return (
    <div className={`layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
