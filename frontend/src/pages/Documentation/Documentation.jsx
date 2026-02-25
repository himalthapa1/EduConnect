import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FaPlay, FaVideo, FaBook } from 'react-icons/fa';
import { MdExpandMore, MdPlayCircleOutline } from 'react-icons/md';
import './Documentation.css';

const Documentation = () => {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const videoResources = [
    {
      title: "Getting Started",
      description: "Learn how to set up your profile and begin using EduConnect.",
      duration: "5 min"
    },
    {
      title: "Platform Walkthrough",
      description: "Explore all features and navigation throughout the platform.",
      duration: "8 min"
    },
    {
      title: "Study Groups & Sessions",
      description: "Learn how groups, sessions, and recommendations work.",
      duration: "10 min"
    }
  ];

  const documentationSections = [
    {
      title: "Getting Started",
      content: (
        <>
          <p>Welcome to EduConnect! This guide will help you get started with the platform.</p>
          <h4>Creating Your Account</h4>
          <ul>
            <li>Click "Register" in the top navigation</li>
            <li>Fill in your email, username, and password</li>
            <li>Complete the onboarding process by selecting your interests</li>
            <li>Your profile is now ready!</li>
          </ul>
          <h4>Setting Up Your Profile</h4>
          <ul>
            <li>Add your courses and academic interests</li>
            <li>Set your study preferences and availability</li>
            <li>Upload a profile picture (optional)</li>
          </ul>
        </>
      )
    },
    {
      title: "Study Groups",
      content: (
        <>
          <p>Study groups are the heart of EduConnect. Here's everything you need to know.</p>
          <h4>Finding Study Groups</h4>
          <ul>
            <li>Browse groups in the "Groups" section</li>
            <li>Use filters to find groups by subject, size, or activity level</li>
            <li>Check group ratings and member count</li>
            <li>Preview group details before joining</li>
          </ul>
          <h4>Creating a Study Group</h4>
          <ul>
            <li>Click "Create Group" from the Groups page</li>
            <li>Add a descriptive name and clear description</li>
            <li>Set privacy settings (public or private)</li>
            <li>Invite members or let others discover your group</li>
          </ul>
          <h4>Managing Your Group</h4>
          <ul>
            <li>Share resources with group members</li>
            <li>Schedule study sessions</li>
            <li>Communicate through group chat</li>
            <li>Moderate content and manage members</li>
          </ul>
        </>
      )
    },
    {
      title: "Study Sessions",
      content: (
        <>
          <p>Study sessions allow you to collaborate with peers in real-time.</p>
          <h4>Joining a Session</h4>
          <ul>
            <li>Browse available sessions in the "Sessions" page</li>
            <li>Check session details, time, and topic</li>
            <li>Click "Join Session" to participate</li>
            <li>Access the session at the scheduled time</li>
          </ul>
          <h4>Creating a Session</h4>
          <ul>
            <li>Click "Create Session" from the Sessions page</li>
            <li>Choose a date, time, and duration</li>
            <li>Add a topic and description</li>
            <li>Set participant limits if needed</li>
            <li>Share with your groups or make it public</li>
          </ul>
        </>
      )
    },
    {
      title: "Recommendations",
      content: (
        <>
          <p>EduConnect uses smart matching to recommend relevant groups and sessions.</p>
          <h4>How Recommendations Work</h4>
          <ul>
            <li>Based on your interests and courses</li>
            <li>Considers your activity and engagement patterns</li>
            <li>Prioritizes active and well-rated groups</li>
            <li>Updates as you interact with the platform</li>
          </ul>
          <h4>Improving Your Recommendations</h4>
          <ul>
            <li>Keep your profile interests up to date</li>
            <li>Engage with groups and sessions regularly</li>
            <li>Rate groups you've participated in</li>
            <li>Complete your profile information</li>
          </ul>
        </>
      )
    },
    {
      title: "Ratings & Popularity",
      content: (
        <>
          <p>Group quality is determined by ratings, participation, and activity levels.</p>
          <h4>Understanding Ratings</h4>
          <ul>
            <li>Groups are rated by members after participation</li>
            <li>Ratings consider quality, engagement, and helpfulness</li>
            <li>High-rated groups appear first in search results</li>
            <li>You can rate groups you've been a member of</li>
          </ul>
          <h4>Group Popularity Factors</h4>
          <ul>
            <li>Member count and activity level</li>
            <li>Session frequency and attendance</li>
            <li>Resource sharing and engagement</li>
            <li>Overall member satisfaction ratings</li>
          </ul>
        </>
      )
    },
    {
      title: "Resource Sharing",
      content: (
        <>
          <p>Share and access study materials within your groups.</p>
          <h4>Uploading Resources</h4>
          <ul>
            <li>Navigate to your group's Resources section</li>
            <li>Click "Upload Resource"</li>
            <li>Add files, links, or notes</li>
            <li>Include a description for context</li>
          </ul>
          <h4>Accessing Resources</h4>
          <ul>
            <li>View all group resources in one place</li>
            <li>Download or preview files</li>
            <li>Search resources by name or type</li>
            <li>Bookmark important materials</li>
          </ul>
        </>
      )
    },
    {
      title: "Account & Privacy",
      content: (
        <>
          <p>Your data is secure and you have full control over your privacy.</p>
          <h4>Privacy Settings</h4>
          <ul>
            <li>Control who can see your profile</li>
            <li>Manage group visibility preferences</li>
            <li>Set notification preferences</li>
            <li>Choose what data to share</li>
          </ul>
          <h4>Data Security</h4>
          <ul>
            <li>Your data is encrypted and securely stored</li>
            <li>We never share your personal information</li>
            <li>You can export or delete your data anytime</li>
            <li>Regular security audits ensure platform safety</li>
          </ul>
          <h4>Managing Your Account</h4>
          <ul>
            <li>Update profile information anytime</li>
            <li>Change password and security settings</li>
            <li>Leave or join groups freely</li>
            <li>Deactivate or delete your account if needed</li>
          </ul>
        </>
      )
    }
  ];

  const tutorialVideos = [
    {
      title: "How to Join a Study Group",
      description: "Step-by-step guide to finding and joining your first study group.",
      duration: "4:30"
    },
    {
      title: "Creating Your First Group",
      description: "Learn how to create and manage a successful study group.",
      duration: "6:15"
    },
    {
      title: "Understanding Recommendations",
      description: "How EduConnect suggests groups and sessions for you.",
      duration: "5:00"
    },
    {
      title: "Uploading Resources",
      description: "Share study materials and resources with your group.",
      duration: "3:45"
    },
    {
      title: "Rating a Group",
      description: "How to rate groups and why it matters for the community.",
      duration: "2:30"
    },
    {
      title: "Privacy & Security Settings",
      description: "Manage your privacy settings and keep your data secure.",
      duration: "5:20"
    }
  ];

  return (
    <div className="documentation-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="docs-hero">
        <div className="docs-hero-container">
          <h1 className="docs-hero-title">Documentation & Resources</h1>
          <p className="docs-hero-subtitle">
            Everything you need to know about using EduConnect effectively
          </p>
        </div>
      </section>

      {/* Video Resources Section (Top) */}
      <section className="docs-section">
        <div className="docs-container">
          <h2 className="docs-section-title">Quick Start Videos</h2>
          <div className="video-resources-grid">
            {videoResources.map((video, index) => (
              <div key={index} className="video-resource-card">
                <div className="video-icon">
                  <FaVideo />
                </div>
                <h3>{video.title}</h3>
                <p>{video.description}</p>
                <span className="video-duration">{video.duration}</span>
                <br />
                <button className="watch-btn">
                  <FaPlay /> Watch Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Content Section (Middle) */}
      <section className="docs-section docs-section-alt">
        <div className="docs-container">
          <h2 className="docs-section-title">Documentation</h2>
          <div className="docs-content">
            <div className="docs-accordion">
              {documentationSections.map((section, index) => (
                <div key={index} className="docs-accordion-item">
                  <button
                    className="docs-accordion-header"
                    onClick={() => toggleAccordion(index)}
                  >
                    <span>{section.title}</span>
                    <span className={`docs-accordion-icon ${openAccordion === index ? 'open' : ''}`}>
                      <MdExpandMore />
                    </span>
                  </button>
                  {openAccordion === index && (
                    <div className="docs-accordion-content">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Watch Videos Section (Bottom) */}
      <section className="docs-section">
        <div className="docs-container">
          <h2 className="docs-section-title">Video Tutorials</h2>
          <div className="watch-videos-grid">
            {tutorialVideos.map((video, index) => (
              <div key={index} className="watch-video-card">
                <div className="video-thumbnail">
                  <MdPlayCircleOutline className="video-play-icon" />
                  <span className="video-duration-badge">{video.duration}</span>
                </div>
                <div className="watch-video-content">
                  <h4>{video.title}</h4>
                  <p>{video.description}</p>
                  <a href="#" className="watch-video-btn">
                    <FaPlay /> Watch Tutorial
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Documentation;
