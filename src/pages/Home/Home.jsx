import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { HiUserGroup } from 'react-icons/hi';
import { FaGraduationCap } from 'react-icons/fa';
import { MdAutoAwesome } from 'react-icons/md';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Optional: Auto-redirect logged-in users
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="home">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <h1 className="hero-title">Learn Better. Together.</h1>
          <p className="hero-subtitle">
            Join collaborative study groups, share resources, and grow with your peers.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn hero-btn-primary">
              Get Started
            </Link>
            <Link to="/groups" className="hero-btn hero-btn-secondary">
              Browse Groups
            </Link>
          </div>
          {isAuthenticated && (
            <p className="redirect-notice">Redirecting to dashboard...</p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <h2 className="section-title">Why EduConnect?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <HiUserGroup />
              </div>
              <h3>Study Groups</h3>
              <p>Join topic-based learning communities and collaborate with peers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaGraduationCap />
              </div>
              <h3>Study Sessions</h3>
              <p>Attend live collaborative sessions and learn together in real-time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <MdAutoAwesome />
              </div>
              <h3>Smart Matching</h3>
              <p>Get personalized group suggestions based on your interests.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="explore">
        <div className="explore-container">
          <h2 className="section-title">Explore EduConnect</h2>
          
          <div className="explore-content">
            {/* Popular Groups Preview */}
            <div className="explore-block">
              <h3 className="explore-subtitle">Popular Study Groups</h3>
              <div className="explore-cards">
                <div className="explore-card">
                  <div className="explore-card-header">
                    <h4>Data Structures & Algorithms</h4>
                    <span className="explore-badge">42 members</span>
                  </div>
                  <p>Master DSA concepts through collaborative problem-solving.</p>
                </div>
                <div className="explore-card">
                  <div className="explore-card-header">
                    <h4>Web Development Bootcamp</h4>
                    <span className="explore-badge">38 members</span>
                  </div>
                  <p>Build modern web applications with React, Node.js, and more.</p>
                </div>
                <div className="explore-card">
                  <div className="explore-card-header">
                    <h4>Machine Learning Fundamentals</h4>
                    <span className="explore-badge">29 members</span>
                  </div>
                  <p>Learn ML concepts and implement algorithms together.</p>
                </div>
              </div>
              <Link to="/groups" className="explore-link">View all groups →</Link>
            </div>

            {/* Upcoming Sessions Preview */}
            <div className="explore-block">
              <h3 className="explore-subtitle">Upcoming Sessions</h3>
              <div className="explore-cards">
                <div className="explore-card">
                  <div className="explore-card-header">
                    <h4>React Hooks Deep Dive</h4>
                    <span className="explore-badge">Today, 3:00 PM</span>
                  </div>
                  <p>Advanced patterns and best practices for React hooks.</p>
                </div>
                <div className="explore-card">
                  <div className="explore-card-header">
                    <h4>Database Design Workshop</h4>
                    <span className="explore-badge">Tomorrow, 2:00 PM</span>
                  </div>
                  <p>Learn to design efficient and scalable database schemas.</p>
                </div>
                <div className="explore-card">
                  <div className="explore-card-header">
                    <h4>Python for Data Science</h4>
                    <span className="explore-badge">Wed, 4:00 PM</span>
                  </div>
                  <p>Introduction to pandas, numpy, and data visualization.</p>
                </div>
              </div>
              <Link to="/sessions" className="explore-link">View all sessions →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="cta-container">
          <h2 className="cta-title">Ready to start learning together?</h2>
          <p className="cta-subtitle">
            Join thousands of students collaborating and achieving their goals.
          </p>
          <Link to="/register" className="cta-btn">
            Join EduConnect
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
