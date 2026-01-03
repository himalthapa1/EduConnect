import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AccountSettings.css';

export default function AccountSettings() {
  const { user, updateProfile } = useAuth();

  const sections = [
     { id: 'my-profile', label: 'My Profile' },
     { id: 'teams', label: 'Teams' },
     { id: 'team-member', label: 'Team Member' },
     { id: 'notifications', label: 'Notifications' }
  ];

    const [active, setActive] = useState('my-profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    name: user?.name || ''
  });
  const [saving, setSaving] = useState(false);
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
}
