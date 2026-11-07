import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_SERVICES, STATUSES, serviceName } from '@shared/services.js';
import { api } from '../api.js';

const STATUS_LABELS = { new: 'New', contacted: 'Contacted', won: 'Won', lost: 'Lost' };
const formatDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso)
  );

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState('inquiries');
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ status: '', service: '', page: 1 });
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [list, setList] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  // Any 401 means the session ended: send the user back to sign in.
  const handleError = useCallback(
    (err) => {
      if (err.status === 401) navigate('/admin/login', { replace: true });
      else setError(err.message);
    },
    [navigate]
  );

  useEffect(() => {
    api('/admin/me').then(setAdmin).catch(handleError);
  }, [handleError]);

  const loadStats = useCallback(() => {
    api('/admin/stats').then(setStats).catch(handleError);
  }, [handleError]);

  const params = new URLSearchParams(
    Object.entries({ status: filters.status, service: filters.service, q }).filter(([, v]) => v)
  ).toString();

  useEffect(() => {
    if (!admin) return;
    loadStats();
  }, [admin, loadStats]);

  useEffect(() => {
    if (!admin || tab !== 'inquiries') return;
    setLoading(true);
    api(`/admin/inquiries?${params}&page=${filters.page}`)
      .then((data) => {
        setList(data);
        setError('');
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [admin, tab, params, filters.page, handleError]);

  // Reset to page 1 when the search changes.
  useEffect(() => setFilters((f) => ({ ...f, page: 1 })), [q]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  async function updateInquiry(id, changes) {
    const before = list.items;
    // Update the screen first, then save; undo if the save fails.
    setList((l) => ({ ...l, items: l.items.map((i) => (i._id === id ? { ...i, ...changes } : i)) }));
    try {
      await api(`/admin/inquiries/${id}`, { method: 'PATCH', body: changes });
      if (changes.status) loadStats();
      return true;
    } catch (err) {
      setList((l) => ({ ...l, items: before }));
      handleError(err);
      return false;
    }
  }

  async function signOut() {
    await api('/admin/logout', { method: 'POST' }).catch(() => {});
    navigate('/admin/login', { replace: true });
  }

  if (!admin) return <div className="container page-pad muted">Checking your session…</div>;

  return (
    <div className="container admin page-pad">
      <div className="admin-head">
        <div>
          <h1>Website inquiries</h1>
          <p className="muted">Signed in as {admin.email}</p>
        </div>
        <button type="button" className="btn btn-quiet" onClick={signOut}>Sign out</button>
      </div>

      {stats && <Pipeline stats={stats} active={filters.status} onPick={(s) => setFilter('status', s)} />}

      <div className="tabs" role="tablist" aria-label="Data">
        <button role="tab" aria-selected={tab === 'inquiries'} onClick={() => setTab('inquiries')}>
          Inquiries {stats && <span className="count">{stats.total}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'subscribers'} onClick={() => setTab('subscribers')}>
          Newsletter {stats && <span className="count">{stats.subscribers}</span>}
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {tab === 'inquiries' ? (
        <>
          <div className="filters">
            <label className="sr-only" htmlFor="filter-q">Search</label>
            <input
              id="filter-q"
              type="search"
              placeholder="Search name, email, company or message"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className="sr-only" htmlFor="filter-status">Status</label>
            <select id="filter-status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <label className="sr-only" htmlFor="filter-service">Service</label>
            <select id="filter-service" value={filters.service} onChange={(e) => setFilter('service', e.target.value)}>
              <option value="">All services</option>
              {ALL_SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
            <a className="btn btn-quiet" href={`/api/admin/inquiries/export.csv?${params}`} download>
              Export CSV
            </a>
          </div>

          <InquiryTable
            items={list.items}
            loading={loading}
            filtered={Boolean(params)}
            openId={openId}
            onToggle={(id) => setOpenId(openId === id ? null : id)}
            onUpdate={updateInquiry}
          />

          {list.pages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button
                className="btn btn-quiet"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Previous
              </button>
              <span>Page {filters.page} of {list.pages}</span>
              <button
                className="btn btn-quiet"
                disabled={filters.page >= list.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      ) : (
        <Subscribers onError={handleError} />
      )}
    </div>
  );
}

// The pipeline bar: each status gets a segment sized by its share of leads.
// Clicking a segment filters the table to that status.
function Pipeline({ stats, active, onPick }) {
  return (
    <section className="pipeline" aria-label="Lead pipeline">
      <div className="pipeline-meta">
        <p><strong>{stats.total}</strong> inquiries in total, <strong>{stats.lastWeek}</strong> in the last 7 days</p>
        {active && <button className="link-button" onClick={() => onPick('')}>Show all statuses</button>}
      </div>
      {stats.total > 0 && (
        <div className="pipeline-bar" aria-hidden="true">
          {STATUSES.filter((s) => stats.byStatus[s] > 0).map((s) => (
            <span key={s} className={`seg status-${s}`} style={{ flexGrow: stats.byStatus[s] }} />
          ))}
        </div>
      )}
      <div className="pipeline-legend">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`legend-item ${active === s ? 'is-active' : ''}`}
            aria-pressed={active === s}
            onClick={() => onPick(active === s ? '' : s)}
          >
            <span className={`dot status-${s}`} />
            {STATUS_LABELS[s]} <strong>{stats.byStatus[s]}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function InquiryTable({ items, loading, filtered, openId, onToggle, onUpdate }) {
  if (loading && !items.length) return <p className="muted table-empty">Loading inquiries…</p>;
  if (!items.length) {
    return (
      <p className="muted table-empty">
        {filtered
          ? 'No inquiries match these filters. Clear the search or pick another status.'
          : 'No inquiries yet. New ones from the contact form will show up here.'}
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table className={`table ${loading ? 'is-loading' : ''}`}>
        <thead>
          <tr>
            <th scope="col">Received</th>
            <th scope="col">From</th>
            <th scope="col">Service</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Details</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <InquiryRow
              key={item._id}
              item={item}
              open={openId === item._id}
              onToggle={() => onToggle(item._id)}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InquiryRow({ item, open, onToggle, onUpdate }) {
  const [notes, setNotes] = useState(item.notes || '');
  const [saved, setSaved] = useState('');

  async function saveNotes() {
    const ok = await onUpdate(item._id, { notes });
    setSaved(ok ? 'Note saved' : '');
  }

  return (
    <>
      <tr className={open ? 'is-open' : ''}>
        <td className="nowrap">{formatDate(item.createdAt)}</td>
        <td>
          <div className="who">{item.name}</div>
          <div className="muted small">
            <a href={`mailto:${item.email}`}>{item.email}</a>
            {item.company && ` · ${item.company}`}
          </div>
        </td>
        <td>{serviceName(item.service)}</td>
        <td>
          <label className="sr-only" htmlFor={`status-${item._id}`}>Status for {item.name}</label>
          <select
            id={`status-${item._id}`}
            className={`status-select status-${item.status}`}
            value={item.status}
            onChange={(e) => onUpdate(item._id, { status: e.target.value })}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </td>
        <td>
          <button type="button" className="link-button" aria-expanded={open} onClick={onToggle}>
            {open ? 'Hide' : 'View'}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="detail-row">
          <td colSpan={5}>
            <div className="detail">
              <div>
                <h3 className="small-heading">Message</h3>
                <p className="message">{item.message}</p>
                {item.industry && <p className="muted small">Industry: {item.industry}</p>}
                {item.sourcePage && <p className="muted small">Sent from: {item.sourcePage}</p>}
              </div>
              <div>
                <label className="small-heading" htmlFor={`notes-${item._id}`}>Internal note</label>
                <textarea
                  id={`notes-${item._id}`}
                  rows={4}
                  maxLength={1000}
                  value={notes}
                  placeholder="Only your team sees this"
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setSaved('');
                  }}
                />
                <div className="button-row">
                  <button type="button" className="btn btn-quiet" onClick={saveNotes} disabled={notes === (item.notes || '')}>
                    Save note
                  </button>
                  <span className="form-status done" role="status">{saved}</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Subscribers({ onError }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/admin/subscribers').then(setData).catch(onError);
  }, [onError]);

  if (!data) return <p className="muted table-empty">Loading subscribers…</p>;
  if (!data.items.length) return <p className="muted table-empty">No subscribers yet. Signups from the footer form will show up here.</p>;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Email</th>
            <th scope="col">Joined</th>
            <th scope="col">Signed up on</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((s) => (
            <tr key={s._id}>
              <td>{s.email}</td>
              <td className="nowrap">{formatDate(s.createdAt)}</td>
              <td className="muted">{s.sourcePage || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
