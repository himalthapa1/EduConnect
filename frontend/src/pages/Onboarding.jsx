import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../utils/api';
import { FiPlus, FiX } from 'react-icons/fi';
import './Onboarding.css';

const INTERESTS = [
  'Mathematics',
  'Artificial Intelligence',
  'Data Structures',
  'Web Development',
  'Machine Learning',
  'Cyber Security',
  'Cloud Computing',
  'UI/UX Design',
  'Mobile App Development',
  'Competitive Programming',
  'English Communication',
  'Finance & Investing',
  'Data Science',
  'DevOps',
  'Blockchain',
  'Game Development',
  'Database Management',
  'Networking',
  'Software Testing',
  'Project Management'
];

const Onboarding = () => {
  const { user, token, verifyToken } = useAuth();
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInterest, setCustomInterest] = useState('');
  const [customError, setCustomError] = useState('');

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else if (prev.length < 10) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const validateCustomInterest = (value) => {
    if (!value.trim()) {
      return 'Interest cannot be empty';
    }
    if (value.length < 2) {
      return 'Interest must be at least 2 characters';
    }
    if (value.length > 50) {
      return 'Interest must be less than 50 characters';
    }
    const normalizedValue = value.trim().toLowerCase();
    const isDuplicate = selectedInterests.some(
      interest => interest.toLowerCase() === normalizedValue
    );
    if (isDuplicate) {
      return 'This interest is already selected';
    }
    return null;
  };

  const handleAddCustomInterest = () => {
    const validationError = validateCustomInterest(customInterest);
    if (validationError) {
      setCustomError(validationError);
      return;
    }

    if (selectedInterests.length >= 10) {
      setCustomError('Maximum 10 interests allowed');
      return;
    }

    const formattedInterest = customInterest.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    setSelectedInterests(prev => [...prev, formattedInterest]);
    setCustomInterest('');
    setCustomError('');
    setShowCustomInput(false);
  };

  const handleRemoveInterest = (interest) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const handleCancelCustom = () => {
    setCustomInterest('');
    setCustomError('');
    setShowCustomInput(false);
  };

  const handleSubmit = async () => {
    if (selectedInterests.length < 3) {
      setError('Please select at least 3 interests');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await usersAPI.setPreferences({ interests: selectedInterests });

      if (res.data?.success) {
        // Refresh user data to update onboarding status
        await verifyToken();
        navigate('/dashboard');
      } else {
        setError('Failed to save preferences');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          'Failed to save preferences';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Choose what you may like</h1>
          <p>This helps us recommend better study groups & sessions for you</p>
        </div>

        <div className="interests-grid">
          {INTERESTS.map(interest => (
            <button
              key={interest}
              className={`interest-button ${selectedInterests.includes(interest) ? 'selected' : ''}`}
              onClick={() => toggleInterest(interest)}
              disabled={selectedInterests.length >= 10 && !selectedInterests.includes(interest)}
            >
              {interest}
            </button>
          ))}
        </div>

        {/* Custom Interest Section - v2.0 */}
        <div className="custom-interest-section" data-version="2.0">
          {!showCustomInput ? (
            <button
              className="btn-custom-toggle"
              onClick={() => setShowCustomInput(true)}
              disabled={selectedInterests.length >= 10}
            >
              <FiPlus size={14} />
              <span>Custom</span>
            </button>
          ) : (
            <div className="custom-input-container">
              <input
                type="text"
                className="custom-interest-input"
                placeholder="Enter custom interest..."
                value={customInterest}
                onChange={(e) => {
                  setCustomInterest(e.target.value);
                  setCustomError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomInterest();
                  }
                }}
                maxLength={50}
                autoFocus
              />
              <div className="custom-input-actions">
                <button
                  className="btn-custom-add"
                  onClick={handleAddCustomInterest}
                  disabled={!customInterest.trim()}
                >
                  Add
                </button>
                <button
                  className="btn-custom-cancel"
                  onClick={handleCancelCustom}
                >
                  Cancel
                </button>
              </div>
              {customError && (
                <div className="custom-error">{customError}</div>
              )}
            </div>
          )}
        </div>

        {selectedInterests.length > 0 && (
          <div className="selected-interests">
            <h3>Selected Interests:</h3>
            <div className="selected-interests-list">
              {selectedInterests.map(interest => (
                <div key={interest} className="selected-interest-tag">
                  <span>{interest}</span>
                  <button
                    className="remove-interest-btn"
                    onClick={() => handleRemoveInterest(interest)}
                    aria-label={`Remove ${interest}`}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="selection-info">
          <p>
            Selected: {selectedInterests.length}/10
            {selectedInterests.length < 3 && (
              <span className="warning"> (minimum 3 required)</span>
            )}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="onboarding-actions">
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={selectedInterests.length < 3 || loading}
          >
            {loading ? 'Saving...' : 'Continue to EduConnect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
