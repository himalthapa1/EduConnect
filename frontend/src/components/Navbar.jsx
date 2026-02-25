import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMenu, HiX } from 'react-icons/hi';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          EduConnect
        </Link>
        
        {/* Desktop Menu */}
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/about" className="navbar-link">About</Link>
          <Link to="/support" className="navbar-link">Support</Link>
          <Link to="/groups" className="navbar-link">Study Groups</Link>
          <Link to="/sessions" className="navbar-link">Sessions</Link>
        </div>

        {/* Desktop Auth */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')} 
              className="navbar-btn navbar-btn-primary"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="navbar-btn navbar-btn-secondary">
                Login
              </Link>
              <Link to="/register" className="navbar-btn navbar-btn-primary">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-menu-link" onClick={closeMobileMenu}>Home</Link>
          <Link to="/about" className="mobile-menu-link" onClick={closeMobileMenu}>About</Link>
          <Link to="/support" className="mobile-menu-link" onClick={closeMobileMenu}>Support</Link>
          <Link to="/groups" className="mobile-menu-link" onClick={closeMobileMenu}>Study Groups</Link>
          <Link to="/sessions" className="mobile-menu-link" onClick={closeMobileMenu}>Sessions</Link>
          
          <div className="mobile-menu-auth">
            {isAuthenticated ? (
              <button 
                onClick={() => {
                  navigate('/dashboard');
                  closeMobileMenu();
                }} 
                className="navbar-btn navbar-btn-primary mobile-btn"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="navbar-btn navbar-btn-secondary mobile-btn" onClick={closeMobileMenu}>
                  Login
                </Link>
                <Link to="/register" className="navbar-btn navbar-btn-primary mobile-btn" onClick={closeMobileMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
