import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    collegeName: '',
    currentYear: '1st Year'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Check if user has completed onboarding
      if (user && !user.onboarding?.completed) {
        navigate('/onboarding/interests');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must not exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 16) {
        newErrors.dateOfBirth = 'You must be at least 16 years old';
      }
    }

    // College name validation
    if (!formData.collegeName.trim()) {
      newErrors.collegeName = 'College name is required';
    } else if (formData.collegeName.length < 3) {
      newErrors.collegeName = 'College name must be at least 3 characters';
    }

    // Current year validation
    if (!formData.currentYear) {
      newErrors.currentYear = 'Current year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.general;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      if (result.details && result.details.length > 0) {
        const fieldErrors = {};
        result.details.forEach(detail => {
          fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: result.error });
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join our study group community</p>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form two-column">
          {/* Left Column */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
              {errors.username && (
                <span className="field-error">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                showStrengthMeter={true}
                placeholder="Create a password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <PasswordInput
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isLoading}
                showStrengthMeter={false}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label" htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                disabled={isLoading}
                min="1900-01-01"
                max="9999-12-31"
              />
              {errors.dateOfBirth && (
                <span className="field-error">{errors.dateOfBirth}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="collegeName">College Name</label>
              <input
                type="text"
                id="collegeName"
                className={`form-input ${errors.collegeName ? 'error' : ''}`}
                placeholder="e.g., IIT Delhi, Delhi University"
                value={formData.collegeName}
                onChange={(e) => handleInputChange('collegeName', e.target.value)}
                disabled={isLoading}
                autoComplete="organization"
              />
              {errors.collegeName && (
                <span className="field-error">{errors.collegeName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currentYear">Current Year</label>
              <select
                id="currentYear"
                className={`form-select ${errors.currentYear ? 'error' : ''}`}
                value={formData.currentYear}
                onChange={(e) => handleInputChange('currentYear', e.target.value)}
                disabled={isLoading}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Other">Other</option>
              </select>
              {errors.currentYear && (
                <span className="field-error">{errors.currentYear}</span>
              )}
            </div>
          </div>

          {/* Full Width Button */}
          <div className="full-width">
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button 
          className="google-auth-button"
          onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/api/auth/google`}
          disabled={isLoading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
