import { useState, useEffect, useRef } from 'react';
import './PasswordInput.css';

const PasswordInput = ({
  value,
  onChange,
  placeholder = "Enter password",
  disabled = false,
  showStrengthMeter = true,
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Caps lock detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFocused) {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }
    };

    const handleKeyUp = (e) => {
      if (isFocused) {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isFocused]);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    // Check caps lock on focus
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleBlur = () => {
    setIsFocused(false);
    setCapsLockOn(false);
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '#e5e7eb' };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
    if (score <= 4) return { score, label: 'Good', color: '#3b82f6' };
    return { score: 5, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(value);

  return (
    <div className={`password-input-wrapper ${className}`}>
      <div className="password-input-container">
        <input
          ref={inputRef}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="password-input-field"
          {...props}
        />

        <button
          type="button"
          className="password-toggle-btn"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeIcon /> : <EyeOffIcon />}
        </button>

        {capsLockOn && (
          <div className="caps-lock-warning">
            <span>⚠️ Caps Lock is on</span>
          </div>
        )}
      </div>

      {showStrengthMeter && value && (
        <div className="password-strength-meter">
          <div className="strength-bars">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`strength-bar ${level <= strength.score ? 'active' : ''}`}
                style={{
                  backgroundColor: level <= strength.score ? strength.color : '#e5e7eb'
                }}
              />
            ))}
          </div>
          <span className="strength-label" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
};

// SVG Eye Icon Components
const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="eye-icon"
  >
    <path
      d="M1 12C3.5 7 7.5 4 12 4s8.5 3 11 8c-2.5 5-6.5 8-11 8S3.5 17 1 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="eye-icon"
  >
    <path
      d="M1 12C3.5 7 7.5 4 12 4s8.5 3 11 8c-2.5 5-6.5 8-11 8S3.5 17 1 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 3l18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default PasswordInput;
