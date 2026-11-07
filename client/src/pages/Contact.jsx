import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SERVICE_GROUPS, GENERAL_SERVICE, SERVICE_SLUGS, serviceName } from '@shared/services.js';
import { api, isEmail } from '../api.js';

const EMPTY = { name: '', email: '', company: '', industry: '', service: 'general', message: '', website: '' };
const MESSAGE_MAX = 2000;

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter your name';
  if (!isEmail(form.email)) errors.email = 'Enter a valid email address';
  if (form.message.trim().length < 10) errors.message = 'Tell us a little more (at least 10 characters)';
  if (form.message.length > MESSAGE_MAX) errors.message = `Keep the message under ${MESSAGE_MAX} characters`;
  return errors;
}

export default function Contact() {
  const [params] = useSearchParams();
  const presetParam = params.get('service');
  const preset = SERVICE_SLUGS.includes(presetParam) ? presetParam : null;

  const [form, setForm] = useState({ ...EMPTY, service: preset || 'general' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const successRef = useRef(null);

  // If someone clicks a different "Ask about this" link while on this page.
  useEffect(() => {
    if (preset) setForm((f) => ({ ...f, service: preset }));
  }, [preset]);

  useEffect(() => {
    if (status === 'sent') successRef.current?.focus();
  }, [status]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted fields.');
      document.getElementById(`field-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setStatus('sending');
    setFormError('');
    try {
      const res = await api('/inquiries', {
        method: 'POST',
        body: { ...form, sourcePage: window.location.pathname + window.location.search },
      });
      setResult({ reference: res.reference, email: form.email.trim(), service: form.service });
      setStatus('sent');
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="container narrow page-pad">
        <div className="success" tabIndex={-1} ref={successRef}>
          <h1>Inquiry sent</h1>
          <p>
            Your reference is <strong className="reference">{result.reference}</strong>. We’ll reply to{' '}
            <strong>{result.email}</strong> within one working day about{' '}
            {result.service === 'general' ? 'your project' : serviceName(result.service)}.
          </p>
          <div className="button-row">
            <Link to="/" className="btn">Back to services</Link>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setForm({ ...EMPTY });
                setResult(null);
                setStatus('idle');
              }}
            >
              Send another inquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fieldProps = (name) => ({
    id: `field-${name}`,
    name,
    value: form[name],
    onChange: update(name),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `error-${name}` : undefined,
  });

  const fieldError = (name) =>
    errors[name] ? <p className="field-error" id={`error-${name}`}>{errors[name]}</p> : null;

  return (
    <div className="container contact-layout page-pad">
      <section className="contact-intro">
        <h1>Start a project</h1>
        {preset ? (
          <p className="lede">
            You’re asking about <strong>{serviceName(preset)}</strong>. Add a few details and the right person will
            get back to you.
          </p>
        ) : (
          <p className="lede">Tell us what you’re building. A short description is enough to get started.</p>
        )}

        <h2 className="small-heading">What happens next</h2>
        <ol className="next-steps">
          <li>The team for your service reads your message.</li>
          <li>You get a reply within one working day.</li>
          <li>We set up a short discovery call to scope the work.</li>
        </ol>
        <p className="muted">
          Prefer email? Write to <a href="mailto:opportunities@cynbit.in">opportunities@cynbit.in</a>.
        </p>
      </section>

      <form className="card form" onSubmit={handleSubmit} noValidate aria-label="Project inquiry">
        {formError && (
          <p className="form-error" id="form-error" role="alert">{formError}</p>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="field-name">Full name</label>
            <input type="text" autoComplete="name" {...fieldProps('name')} />
            {fieldError('name')}
          </div>
          <div className="field">
            <label htmlFor="field-email">Work email</label>
            <input type="email" autoComplete="email" {...fieldProps('email')} />
            {fieldError('email')}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="field-company">Company <span className="optional">(optional)</span></label>
            <input type="text" autoComplete="organization" {...fieldProps('company')} />
            {fieldError('company')}
          </div>
          <div className="field">
            <label htmlFor="field-industry">Industry <span className="optional">(optional)</span></label>
            <input type="text" placeholder="Retail, healthcare, education…" {...fieldProps('industry')} />
            {fieldError('industry')}
          </div>
        </div>

        <div className="field">
          <label htmlFor="field-service">Service</label>
          <select {...fieldProps('service')}>
            {SERVICE_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.title}>
                {group.services.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </optgroup>
            ))}
            <option value={GENERAL_SERVICE.slug}>{GENERAL_SERVICE.name}</option>
          </select>
          {fieldError('service')}
        </div>

        <div className="field">
          <label htmlFor="field-message">What do you want to build?</label>
          <textarea rows={6} maxLength={MESSAGE_MAX} {...fieldProps('message')} />
          <div className="field-foot">
            {fieldError('message')}
            <span className="counter">{form.message.length}/{MESSAGE_MAX}</span>
          </div>
        </div>

        {/* Honeypot: hidden from people and screen readers. Bots that fill it are ignored by the server. */}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="field-website">Website</label>
          <input id="field-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
        </div>

        <button type="submit" className="btn btn-full" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending inquiry…' : 'Send inquiry'}
        </button>
      </form>
    </div>
  );
}
