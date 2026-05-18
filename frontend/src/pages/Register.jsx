import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      await register(form.email, form.username, form.password);
      navigate('/build');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-auth">
      <div className="auth-card">
        <GlitchText text="SIGN UP" tag="h2" className="auth-title" />
        <p className="auth-subtitle">1 free build per day — no card needed</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">EMAIL</label>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="label">USERNAME</label>
            <input
              type="text"
              name="username"
              className="input"
              placeholder="garagewrench99"
              value={form.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={30}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="label">PASSWORD</label>
            <input
              type="password"
              name="password"
              className="input"
              placeholder="min 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="label">CONFIRM PASSWORD</label>
            <input
              type="password"
              name="confirm"
              className="input"
              placeholder="••••••••"
              value={form.confirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
