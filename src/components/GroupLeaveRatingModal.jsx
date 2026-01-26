import React, { useState } from 'react';
import { groupsAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import './GroupLeaveRatingModal.css';

const GroupLeaveRatingModal = ({ 
  isOpen, 
  onClose, 
  onLeaveWithoutRating, 
  groupId, 
  groupName,
  onRatingSubmitted 
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleStarClick = (starIndex) => {
    setRating(starIndex + 1);
  };

  const handleStarHover = (starIndex) => {
    setHoveredRating(starIndex + 1);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setError('Please select a rating before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await groupsAPI.rateGroup(groupId, rating);
      onRatingSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      const errorMessage = error.response?.data?.error?.message ||
                          error.response?.data?.message ||
                          'Failed to submit rating. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveWithoutRating = () => {
    onLeaveWithoutRating();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            <Icons.star size={24} />
          </div>
          <h3>Rate your experience</h3>
          <p className="modal-subtitle">
            How was your time in <strong>"{groupName}"</strong>?
          </p>
        </div>

        <div className="rating-section">
          <div className="stars-container">
            {[...Array(5)].map((_, index) => (
              <button
                key={index}
                className={`star-button ${
                  index < (hoveredRating || rating) ? 'filled' : 'empty'
                }`}
                onClick={() => handleStarClick(index)}
                onMouseEnter={() => handleStarHover(index)}
                onMouseLeave={handleStarLeave}
                disabled={isSubmitting}
              >
                <Icons.star size={32} />
              </button>
            ))}
          </div>
          
          {rating > 0 && (
            <div className="rating-label">
              {rating} {rating === 1 ? 'star' : 'stars'}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="submit-btn"
            onClick={handleSubmitRating}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Leave'}
          </button>
          
          <button
            className="skip-btn"
            onClick={handleLeaveWithoutRating}
            disabled={isSubmitting}
          >
            Leave Without Rating
          </button>
        </div>

        <div className="modal-footer">
          <p className="footer-text">
            Your feedback helps improve group quality for everyone
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupLeaveRatingModal;