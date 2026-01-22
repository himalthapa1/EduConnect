import React from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaComments, FaFileAlt, FaBrain, FaArrowRight, FaGraduationCap, FaClock, FaLightbulb } from 'react-icons/fa';
import './Homepage.css';

const Homepage = () => {
  return (
    <div className="homepage">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <FaGraduationCap className="logo-icon" />
            <span className="logo-text">StudyConnect</span>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link nav-link-primary">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Connect. Study. <span className="highlight">Succeed Together.</span>
            </h1>
            <p className="hero-subtitle">
              Join thousands of students creating and joining study groups. 
              Collaborate, share resources, and achieve academic excellence together.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary">
                Get Started Free
                <FaArrowRight className="btn-icon" />
              </Link>
              <Link to="/login" className="btn btn-secondary">
                I Have an Account
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Active Students</span>
              </div>
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Study Groups</span>
              </div>
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Universities</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-placeholder">
              <FaUsers className="hero-icon" />
              <p>Students Collaborating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need to Study Better</h2>
            <p className="section-subtitle">
              Powerful tools designed specifically for student collaboration and learning
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h3 className="feature-title">Create & Join Groups</h3>
              <p className="feature-description">
                Start your own study group or find existing ones based on your courses, 
                interests, and study preferences.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaComments />
              </div>
              <h3 className="feature-title">Real-time Chat</h3>
              <p className="feature-description">
                Communicate instantly with group members, share ideas, ask questions, 
                and stay connected throughout your study sessions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaFileAlt />
              </div>
              <h3 className="feature-title">File Sharing</h3>
              <p className="feature-description">
                Upload and share study materials, notes, assignments, and resources 
                securely within your study groups.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaBrain />
              </div>
              <h3 className="feature-title">AI Recommendations</h3>
              <p className="feature-description">
                Get personalized study group suggestions and resource recommendations 
                powered by intelligent algorithms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How StudyConnect Works</h2>
            <p className="section-subtitle">Get started in just a few simple steps</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Sign Up & Set Preferences</h3>
                <p className="step-description">
                  Create your account and tell us about your courses, study habits, and learning goals.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Find or Create Groups</h3>
                <p className="step-description">
                  Browse existing study groups or create your own based on subjects and study preferences.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Collaborate & Share</h3>
                <p className="step-description">
                  Chat with members, share resources, schedule study sessions, and learn together.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Achieve Success</h3>
                <p className="step-description">
                  Track your progress, get AI recommendations, and achieve better academic results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Students Choose StudyConnect</h2>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <FaClock />
              </div>
              <h3 className="benefit-title">Save Time</h3>
              <p className="benefit-description">
                Find study partners quickly and efficiently. No more searching through social media or bulletin boards.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <FaLightbulb />
              </div>
              <h3 className="benefit-title">Better Understanding</h3>
              <p className="benefit-description">
                Learn from peers, get different perspectives, and understand concepts more deeply through collaboration.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <FaGraduationCap />
              </div>
              <h3 className="benefit-title">Improved Grades</h3>
              <p className="benefit-description">
                Students in study groups typically perform 20% better than those studying alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Study Experience?</h2>
            <p className="cta-subtitle">
              Join thousands of students who are already studying smarter, not harder.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                Create Study Group
                <FaArrowRight className="btn-icon" />
              </Link>
              <Link to="/register" className="btn btn-secondary btn-large">
                Join Study Group
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <FaGraduationCap className="logo-icon" />
              <span className="logo-text">StudyConnect</span>
            </div>
            <p className="footer-text">
              Empowering students to learn better together.
            </p>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 StudyConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;