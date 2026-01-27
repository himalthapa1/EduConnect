import { useState } from 'react';
import { groupsAPI } from '../../utils/api';
import './PollModal.css';

const PollModal = ({ onClose, onSuccess, groupId }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    // Clear error for this option
    if (errors[`option${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`option${index}`];
        return newErrors;
      });
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);

      // Clear error for removed option
      if (errors[`option${index}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`option${index}`];
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!question.trim()) {
      newErrors.question = 'Question is required';
    }

    options.forEach((option, index) => {
      if (!option.trim()) {
        newErrors[`option${index}`] = 'Option cannot be empty';
      }
    });

    // Check for duplicate options
    const trimmedOptions = options.map(opt => opt.trim().toLowerCase());
    const uniqueOptions = new Set(trimmedOptions);
    if (uniqueOptions.size !== trimmedOptions.length) {
      newErrors.general = 'Options must be unique';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const pollData = {
        question: question.trim(),
        options: options.map(option => option.trim())
      };

      console.log('Creating poll:', { groupId, pollData });
      const response = await groupsAPI.createPoll(groupId, pollData);
      console.log('Poll created successfully:', response.data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating poll:', error);
      console.error('Error details:', error.response?.data);
      setErrors({
        general: error.response?.data?.message || 'Failed to create poll'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="poll-modal">
        <div className="modal-header">
          <h2>Create Poll</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="question">Question *</label>
              <input
                type="text"
                id="question"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (errors.question) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.question;
                      return newErrors;
                    });
                  }
                }}
                className={errors.question ? 'error' : ''}
                placeholder="What's your question?"
                disabled={loading}
                maxLength={200}
              />
              {errors.question && <span className="field-error">{errors.question}</span>}
            </div>

            <div className="options-section">
              <label>Options *</label>
              {options.map((option, index) => (
                <div key={index} className="option-row">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className={errors[`option${index}`] ? 'error' : ''}
                    placeholder={`Option ${index + 1}`}
                    disabled={loading}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="remove-option-btn"
                      onClick={() => removeOption(index)}
                      disabled={loading}
                      title="Remove option"
                    >
                      ×
                    </button>
                  )}
                  {errors[`option${index}`] && (
                    <span className="field-error">{errors[`option${index}`]}</span>
                  )}
                </div>
              ))}

              {options.length < 10 && (
                <button
                  type="button"
                  className="add-option-btn"
                  onClick={addOption}
                  disabled={loading}
                >
                  + Add Option
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !question.trim() || options.some(opt => !opt.trim())}
            onClick={handleSubmit}
          >
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollModal;
