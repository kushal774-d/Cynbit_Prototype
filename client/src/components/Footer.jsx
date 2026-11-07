import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, isEmail } from '../api.js';

export default function Footer() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState({ status: 'idle', message: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setState({ status: 'error', message: 'Enter a valid email address.' });
      return;
    }
    setState({ status: 'sending', message: '' });
    try {
      const res = await api('/subscribers', {
        method: 'POST',
        body: { email, website, sourcePage: location.pathname },
      });
      setState({ status: 'done', message: res.message });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: err.fields?.email || err.message });
    }
  }

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section aria-labelledby="newsletter-title">
          <h2 id="newsletter-title">Get the weekly briefing</h2>
          <p className="muted">Short notes on AI automation and software builds. Unsubscribe any time.</p>
          <form className="newsletter" onSubmit={handleSubmit} noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={state.status === 'error'}
              aria-describedby="newsletter-status"
            />
            <input
              type="text"
              name="website"
              className="honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <button type="submit" className="btn btn-light" disabled={state.status === 'sending'}>
              {state.status === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
          <p id="newsletter-status" className={`form-status ${state.status}`} role="status">
            {state.message}
          </p>
        </section>

        <section aria-label="Contact details" className="footer-contact">
          <p>32/115 Pratap Nagar, Jaipur, Rajasthan 302033</p>
          <p><a href="mailto:opportunities@cynbit.in">opportunities@cynbit.in</a></p>
          <p><a href="tel:+918947962667">+91 89479 62667</a></p>
          <p className="footer-admin"><Link to="/admin/login">Team sign-in</Link></p>
        </section>
      </div>
    </footer>
  );
}
