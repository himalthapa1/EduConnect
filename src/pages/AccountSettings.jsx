import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import PasswordInput from '../components/PasswordInput';
import './AccountSettings.css';

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

const AccountSettings = () => {
  const { user, updateProfile, token, verifyToken } = useAuth();

  const sections = [
     { id: 'my-profile', label: 'My Profile' },
     { id: 'preferences', label: 'Preferences' },
     { id: 'teams', label: 'Teams' },
     { id: 'team-member', label: 'Team Member' },
     { id: 'notifications', label: 'Notifications' }
  ];

    const [active, setActive] = useState('my-profile');
  const [editing, setEditing] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(user?.preferences?.interests || []);
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    name: user?.name || ''
  });
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);

    try {
      // Save profile information (username, email)
      const updates = { username: form.username, email: form.email };
      const profileRes = await updateProfile(updates);

      // If password change is initiated, also change password
      let passwordRes = null;
      if (passwordForm.currentPassword && passwordForm.newPassword) {
        // Validate password change
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          setMessage('New passwords do not match');
          setSaving(false);
          return;
        }

        if (passwordForm.newPassword.length < 8) {
          setMessage('New password must be at least 8 characters long');
          setSaving(false);
          return;
        }

        try {
          passwordRes = await usersAPI.changePassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
          });
        } catch (passwordErr) {
          const errorMessage = passwordErr.response?.data?.error ||
                              passwordErr.response?.data?.message ||
                              passwordErr.message ||
                              'Failed to change password';
          setMessage(typeof errorMessage === 'string' ? errorMessage : 'Failed to change password');
          setSaving(false);
          return;
        }
      }

      if (profileRes?.success && (!passwordRes || passwordRes.data?.success)) {
        if (profileRes.user) {
          setForm({
            username: profileRes.user.username || '',
            email: profileRes.user.email || '',
            name: profileRes.user.name || ''
          });
        }

        // Reset password form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        const successMessage = passwordRes ? 'Profile and password updated successfully' : 'Profile updated successfully';
        setMessage(successMessage);
        setEditing(false);
      } else {
        setMessage('Update failed');
      }
    } catch (err) {
      setMessage('Update failed');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    setMessage(null);

    try {
      const res = await axios.post(
        'http://localhost:3001/api/users/preferences',
        { interests: selectedInterests },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setMessage('Preferences updated successfully');
        setEditingPreferences(false);
      } else {
        setMessage('Failed to update preferences');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          'Failed to update preferences';
      setMessage(typeof errorMessage === 'string' ? errorMessage : 'Failed to update preferences');
    } finally {
      setSavingPreferences(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCancelPreferences = () => {
    setSelectedInterests(user?.preferences?.interests || []);
    setEditingPreferences(false);
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSavePassword = async () => {
    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage('All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage('New password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const res = await usersAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.data?.success) {
        setMessage('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setChangingPassword(false);
      } else {
        setMessage(res.data?.error || 'Failed to change password');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          err.message ||
                          'Failed to change password';
      setMessage(typeof errorMessage === 'string' ? errorMessage : 'Failed to change password');
    } finally {
      setChangingPassword(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z\d]/.test(password)) score++;

    const levels = [
      { level: 0, text: '', color: '#ccc' },
      { level: 1, text: 'Weak', color: '#ff4444' },
      { level: 2, text: 'Fair', color: '#ffaa00' },
      { level: 3, text: 'Good', color: '#00aa44' },
      { level: 4, text: 'Strong', color: '#00aa44' },
      { level: 5, text: 'Very Strong', color: '#00aa44' }
    ];

    return levels[score] || levels[0];
  };

  if (!user) {
    return (
      <div className="account-settings">
        <div className="account-wrapper">
          <main className="account-main">
            <div className="profile-card">
              <div>Please log in to view account settings.</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="account-settings">
      <div className="account-wrapper">
        <aside className="account-sidebar">
          <h3 className="account-title">Account Settings</h3>
          <nav className="account-nav">
            {sections.map(s => (
              <button
                key={s.id}
                className={`account-nav-item ${active === s.id ? 'active' : ''} ${s.danger ? 'danger' : ''}`}
                onClick={() => setActive(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="account-main">
          {active === 'my-profile' ? (
            <>
              {/* Profile Header */}
              <div className="profile-header">
                <div className="avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
                <div>
                  <h2>{user?.username || 'User'}</h2>
                  <p className="muted">{user?.email || ''}</p>
                </div>
              </div>

              {/* Account Information Card */}
              <div className="card">
                <h3>Account Information</h3>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>

                <div className="form-group">
                  <label>Current Password</label>
                  <PasswordInput
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    disabled={!editing}
                  />
                </div>

                {editing && (
                  <>
                    <div className="form-group">
                      <label>New Password</label>
                      <PasswordInput
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <PasswordInput
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                      />
                      {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <small style={{ color: '#ff4444' }}>Passwords do not match</small>
                      )}
                      <small>Password must be at least 8 characters with uppercase, lowercase, and numbers</small>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={true}
                  />
                  <small>Email cannot be changed</small>
                </div>
              </div>

              {/* Form Footer */}
              <div className="form-footer">
                <button className="btn-secondary" onClick={() => {
                  setEditing(false);
                  setForm({
                    username: user?.username || '',
                    email: user?.email || '',
                    name: user?.name || ''
                  });
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={editing ? handleSave : () => setEditing(true)} disabled={saving}>
                  {editing ? (saving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone">
                <h4>Danger Zone</h4>
                <div className="card danger">
                  <p>Deleting your account is permanent. This will remove all your data and cannot be undone.</p>
                  <button className="btn-danger">Delete Account</button>
                </div>
              </div>

              {/* Success/Error Messages */}
              {message && (
                <div className={`alert ${message.includes('failed') ? 'alert-error' : 'alert-success'}`}>
                  {message}
                </div>
              )}
            </>
          ) : active === 'preferences' ? (
            <>
              {/* Preferences Header */}
              <div className="profile-header">
                <div className="avatar">⚙️</div>
                <div>
                  <h2>Study Preferences</h2>
                  <p className="muted">Customize your learning interests to get better recommendations</p>
                </div>
              </div>

              {/* Current Preferences Display */}
              {!editingPreferences && (
                <div className="card">
                  <h3>Your Interests</h3>
                  {selectedInterests.length > 0 ? (
                    <div className="interests-display">
                      {selectedInterests.map(interest => (
                        <span key={interest} className="interest-tag">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No interests selected yet.</p>
                  )}
                </div>
              )}

              {/* Edit Preferences */}
              {editingPreferences && (
                <div className="card">
                  <h3>Select Your Interests</h3>
                  <p className="muted">Choose topics you're interested in studying (3-10 selections)</p>

                  <div className="interests-grid">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest}
                        className={`interest-button ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>

                  <div className="selection-info">
                    <p>
                      Selected: {selectedInterests.length}/10
                    </p>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="action-bar">
                {!editingPreferences ? (
                  <button className="btn-primary" onClick={() => setEditingPreferences(true)}>
                    Edit Preferences
                  </button>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={handleCancelPreferences}>
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                    >
                      {savingPreferences ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </>
                )}
              </div>

              {/* Success/Error Messages */}
              {message && (
                <div className={`alert ${message.includes('failed') || message.includes('error') ? 'alert-error' : 'alert-success'}`}>
                  {message}
                </div>
              )}
            </>
          ) : (
            /* Placeholder content for other sections */
            <div className="section-placeholder">
              <h2>{sections.find(s => s.id === active)?.label}</h2>
              <div className="card">
                <p>This feature is coming soon. Check back later for updates!</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AccountSettings;
