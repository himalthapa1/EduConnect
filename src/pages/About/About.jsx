import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FaRocket, FaUsers, FaLightbulb, FaHeart } from 'react-icons/fa';
import { MdSchool, MdGroups } from 'react-icons/md';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-container">
          <h1 className="about-hero-title">About EduConnect</h1>
          <p className="about-hero-subtitle">
            Empowering students to learn better through collaboration and community
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-content-grid">
            <div className="about-text">
              <h2 className="about-section-title">Our Mission</h2>
              <p className="about-paragraph">
                At EduConnect, we believe that learning is better together. Our mission is to create 
                a collaborative learning environment where students can connect, share knowledge, 
                and achieve their academic goals as a community.
              </p>
              <p className="about-paragraph">
                We're building a platform that breaks down the barriers of isolated learning and 
                fosters meaningful connections between students who share similar academic interests 
                and goals.
              </p>
            </div>
            <div className="about-icon-large">
              <FaRocket />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="about-section about-section-alt">
        <div className="about-container">
          <h2 className="about-section-title-center">What We Do</h2>
          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="about-feature-icon">
                <MdGroups />
              </div>
              <h3>Study Groups</h3>
              <p>
                Connect students with similar courses and interests into collaborative 
                study groups where they can share resources, discuss concepts, and learn together.
              </p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">
                <MdSchool />
              </div>
              <h3>Study Sessions</h3>
              <p>
                Organize and join live study sessions where students can collaborate in real-time, 
                work through problems together, and support each other's learning journey.
              </p>
            </div>
            <div className="about-feature-card">
              <div className="about-feature-icon">
                <FaLightbulb />
              </div>
              <h3>Smart Recommendations</h3>
              <p>
                Get personalized group and session recommendations based on your interests, 
                courses, and learning preferences to find the perfect study community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="about-section">
        <div className="about-container">
          <h2 className="about-section-title-center">Our Story</h2>
          <div className="about-story">
            <p className="about-paragraph">
              EduConnect was born from a simple observation: students learn better when they 
              learn together. Traditional education often isolates learners, but we knew there 
              had to be a better way.
            </p>
            <p className="about-paragraph">
              We started with a vision to create a platform where students could easily find 
              study partners, form meaningful learning communities, and support each other 
              through their academic journey. Today, thousands of students use EduConnect to 
              collaborate, share knowledge, and achieve their goals together.
            </p>
            <p className="about-paragraph">
              Our platform continues to evolve based on feedback from our community, always 
              with one goal in mind: making collaborative learning accessible, effective, 
              and enjoyable for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-section about-section-alt">
        <div className="about-container">
          <h2 className="about-section-title-center">Our Values</h2>
          <div className="about-values-grid">
            <div className="about-value-card">
              <div className="about-value-icon">
                <FaUsers />
              </div>
              <h3>Community First</h3>
              <p>
                We prioritize building a supportive and inclusive community where every 
                student feels welcome and valued.
              </p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">
                <FaLightbulb />
              </div>
              <h3>Innovation</h3>
              <p>
                We continuously innovate to provide the best tools and features that 
                enhance collaborative learning experiences.
              </p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">
                <FaHeart />
              </div>
              <h3>Student Success</h3>
              <p>
                Your success is our success. We're committed to helping every student 
                achieve their academic goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-stats">
            <div className="about-stat">
              <div className="about-stat-number">10,000+</div>
              <div className="about-stat-label">Active Students</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-number">500+</div>
              <div className="about-stat-label">Study Groups</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-number">2,000+</div>
              <div className="about-stat-label">Study Sessions</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-number">50+</div>
              <div className="about-stat-label">Universities</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="about-cta-container">
          <h2 className="about-cta-title">Join Our Community</h2>
          <p className="about-cta-subtitle">
            Be part of a growing community of students who are learning better together.
          </p>
          <a href="/register" className="about-cta-btn">
            Get Started Today
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
