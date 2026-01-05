import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
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
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const updates = { username: form.username, email: form.email };
    const res = await updateProfile(updates);
    setSaving(false);
    if (res?.success) {
      if (res.user) {
        setForm({
          username: res.user.username || '',
          email: res.user.email || '',
          name: res.user.name || ''
        });
      }
      setMessage('Profile updated');
      setEditing(false);
    } else {
      setMessage('Update failed');
    }
    setTimeout(() => setMessage(null), 3000);
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

              {/* Action Bar */}
              <div className="action-bar">
                {!editing ? (
                  <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={() => {
                      setEditing(false);
                      setForm({
                        username: user?.username || '',
                        email: user?.email || '',
                        name: user?.name || ''
                      });
                    }}>
                      Cancel
                    </button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
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
