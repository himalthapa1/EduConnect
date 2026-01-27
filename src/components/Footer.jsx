import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">EduConnect</h3>
            <p className="footer-tagline">Learn Better. Together.</p>
          </div>
          
          <div className="footer-section">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/groups">Study Groups</Link></li>
              <li><Link to="/sessions">Sessions</Link></li>
              <li><Link to="/documentation">Documentation</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/support">Support</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} EduConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
