import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FaQuestionCircle, FaEnvelope, FaBook, FaComments } from 'react-icons/fa';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import './Support.css';

const Support = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How are study groups recommended to me?",
      answer: "Groups are suggested based on your interests, activity, and overall group engagement to help you find relevant and active communities."
    },
    {
      question: "Can I trust the quality of study groups?",
      answer: "Yes. Groups are highlighted using ratings, member participation, and activity levels so high-quality communities appear first."
    },
    {
      question: "What if there are multiple groups with the same name?",
      answer: "Groups may share similar names, but active and well-rated groups are ranked higher to help you choose the best option."
    },
    {
      question: "Is my personal data safe on EduConnect?",
      answer: "Yes. Your data is securely stored and used only to improve your learning experience and recommendations."
    },
    {
      question: "Can I leave or change groups anytime?",
      answer: "Absolutely. You are free to join or leave study groups whenever you want."
    },
    {
      question: "How do I create a study group?",
      answer: "To create a study group, log in to your dashboard, navigate to the 'Groups' section, and click on 'Create New Group'. Fill in the group details including name, description, subject, and privacy settings. Once created, you can invite members or make it public for others to join."
    },
    {
      question: "How do I join a study session?",
      answer: "Browse available study sessions in the 'Sessions' page. Click on any session that interests you to view details. If you meet the requirements, click the 'Join Session' button. You'll receive a confirmation and can access the session at the scheduled time."
    },
    {
      question: "Can I schedule my own study sessions?",
      answer: "Yes! Go to the 'Sessions' page and click 'Create Session'. Choose a date, time, topic, and whether it's open to everyone or just your group members. You can also set a maximum number of participants and add any materials or resources needed."
    },
    {
      question: "How does the Smart Matching feature work?",
      answer: "Smart Matching uses your profile information, including your courses, interests, and study preferences, to recommend relevant study groups and sessions. The more you interact with the platform, the better the recommendations become."
    },
    {
      question: "Is EduConnect free to use?",
      answer: "Yes, EduConnect is completely free for all students. We believe in making collaborative learning accessible to everyone. Simply create an account and start connecting with other students."
    },
    {
      question: "How do I share resources with my study group?",
      answer: "Within each study group, there's a 'Resources' section where you can upload documents, links, and notes. All group members can access and contribute to the shared resource library."
    },
    {
      question: "How do I report inappropriate behavior?",
      answer: "We take community safety seriously. If you encounter inappropriate behavior, click the 'Report' button on the user's profile or content. Our moderation team will review the report and take appropriate action."
    },
    {
      question: "Can I use EduConnect on mobile devices?",
      answer: "Yes! EduConnect is fully responsive and works on all devices including smartphones and tablets. Simply access the platform through your mobile browser for the full experience."
    },
    {
      question: "How do I update my profile and preferences?",
      answer: "Click on your profile icon in the top right corner and select 'Account Settings'. From there, you can update your personal information, courses, interests, notification preferences, and privacy settings."
    }
  ];

  return (
    <div className="support-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="support-hero">
        <div className="support-hero-container">
          <h1 className="support-hero-title">How Can We Help?</h1>
          <p className="support-hero-subtitle">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>
      </section>

      {/* Quick Help Cards */}
      <section className="support-section">
        <div className="support-container">
          <div className="support-cards-grid">
            <div className="support-card">
              <div className="support-card-icon">
                <FaQuestionCircle />
              </div>
              <h3>FAQs</h3>
              <p>Find quick answers to frequently asked questions</p>
            </div>
            <Link to="/documentation" style={{ textDecoration: 'none' }}>
              <div className="support-card">
                <div className="support-card-icon">
                  <FaBook />
                </div>
                <h3>Documentation</h3>
                <p>Explore detailed guides and tutorials</p>
              </div>
            </Link>
            <div className="support-card">
              <div className="support-card-icon">
                <FaComments />
              </div>
              <h3>Community</h3>
              <p>Connect with other users and share tips</p>
            </div>
            <Link to="/contact" style={{ textDecoration: 'none' }}>
              <div className="support-card">
                <div className="support-card-icon">
                  <FaEnvelope />
                </div>
                <h3>Contact Us</h3>
                <p>Reach out to our support team directly</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="support-section support-section-alt">
        <div className="support-container">
          <h2 className="support-section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button 
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">
                    {openFaq === index ? <MdExpandLess /> : <MdExpandMore />}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Support;
