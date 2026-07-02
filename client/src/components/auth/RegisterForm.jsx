import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="subtitle">Join the conversation.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              className="input"
              value={form.displayName}
              onChange={update('displayName')}
              required
              maxLength={64}
            />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              value={form.username}
              onChange={update('username')}
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_.]+"
              title="Letters, numbers, underscores and periods only"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              required
              minLength={8}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
