import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

// Create context for mobile menu
const MobileMenuContext = createContext();

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within MobileMenuProvider');
  }
  return context;
};

const Layout = () => {
  const { user, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user needs onboarding (only if authenticated and onboarding not completed)
  if (isAuthenticated && user && !user?.onboarding?.completed) {
    return <Navigate to="/onboarding/interests" replace />;
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <MobileMenuContext.Provider value={{ toggleMobileMenu, closeMobileMenu, mobileMenuOpen }}>
      <div className={`layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={closeMobileMenu}></div>
        )}

        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileClose={closeMobileMenu}
        />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </MobileMenuContext.Provider>
  );
};

export default Layout;
