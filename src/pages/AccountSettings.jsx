import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AccountSettings.css';

export default function AccountSettings() {
  const { user, updateProfile } = useAuth();

  const sections = [
     { id: 'my-profile', label: 'My Profile' },
     { id: 'teams', label: 'Teams' },
     { id: 'team-member', label: 'Team Member' },
     { id: 'notifications', label: 'Notifications' },
     { id: 'delete', label: 'Delete Account', danger: true }
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
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="avatar">{(user?.username || 'U').charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <h4>{user?.username || 'User'}</h4>
                <div className="muted">{user?.email || ''}</div>
              </div>
              <div className="profile-edit">
                {!editing ? (
                  <button className="edit-btn" onClick={() => setEditing(true)}>Edit</button>
                ) : (
                  <>
                    <button className="edit-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    <button className="edit-btn" onClick={() => { setEditing(false); setForm({ username: user?.username || '', email: user?.email || '', name: user?.name || '' }); }}>Cancel</button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-sections">
              {active === 'my-profile' && (
                <section>
                  <h5>My Profile</h5>
                  <div className="card">
                    {editing ? (
                      <div className="edit-form">
                        <label>Username</label>
                        <input name="username" value={form.username} onChange={handleChange} />
                        <label>Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} />
                      </div>
                    ) : (
                      <div>
                        <strong>{user?.username}</strong>
                        <div className="muted">{user?.email}</div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {active === 'team-member' && (
                <section>
                  <h5>Team Member</h5>
                  <div className="card">{/* Place for list of team members. */}
                    <div>No team members to show.</div>
                  </div>
                </section>
              )}

              {active === 'notifications' && (
                <section>
                  <h5>Notifications</h5>
                  <div className="card">Notification preferences will appear here.</div>
                </section>
              )}

              {active === 'delete' && (
                <section>
                  <h5>Delete Account</h5>
                  <div className="card danger">
                    <p>Deleting your account is permanent. This will remove all your data.</p>
                    <button className="delete-btn">Delete Account</button>
                  </div>
                </section>
              )}

              {message && <div style={{ marginTop: 12 }}>{message}</div>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
