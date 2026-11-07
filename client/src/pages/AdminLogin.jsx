import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    api('/admin/me').then(() => navigate('/admin', { replace: true })).catch(() => {});
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api('/admin/login', { method: 'POST', body: form });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  return (
    <div className="container login page-pad">
      <form className="card form" onSubmit={handleSubmit}>
        <h1>Team sign-in</h1>
        <p className="muted">View and follow up on website inquiries.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-full" disabled={sending}>
          {sending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
