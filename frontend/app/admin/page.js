'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

export default function Admin() {
  const [authed, setAuthed] = useState(null); // null = checking
  useEffect(() => {
    api('/api/admin/me').then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <p className="admin-loading muted">Loading...</p>;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  return <div className="admin-page"><Dashboard onLogout={() => setAuthed(false)} /></div>;
}

function Login({ onDone }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onDone();
    } catch (err) { setError(err.message); }
  }

  return (
    <main className="admin-login">
    <form className="login-card" onSubmit={submit}>
      <img src="/logo.webp" alt="Sri Venkateshwara Dairy Delights" className="login-logo" />
      <h1>Admin Login</h1>
      <p className="muted">Sign in to manage your products</p>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary">Login</button>
    </form>
    </main>
  );
}

// Close a popup menu on outside click or Escape
function useDismiss(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('products');
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const closeMenu = () => setMenuOpen(false);
  const menuRef = useDismiss(menuOpen, closeMenu);
  useEffect(() => { api('/api/admin/me').then((r) => setEmail(r.email || '')).catch(() => {}); }, []);

  async function logout() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    onLogout();
  }
  return (
    <>
      <header className="admin-top">
        <div className="admin-brand">
          <img src="/logo.webp" alt="" />
          <h1>Admin</h1>
        </div>
        <div className="avatar-wrap" ref={menuRef}>
          <button className="avatar" aria-label="Account menu" aria-haspopup="menu" aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(!menuOpen)}>
            A
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              {email && <div className="menu-email">{email}</div>}
              <button role="menuitem" onClick={() => { setTab('settings'); closeMenu(); }}>Profile Settings</button>
              <button role="menuitem" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <main className="admin-main">
        {tab === 'settings' ? (
          <button className="btn btn-outline btn-sm" style={{ marginBottom: 20 }} onClick={() => setTab('products')}>← Back</button>
        ) : (
          <div className="tabs">
            {[['products', 'Products'], ['clicks', 'Analytics']].map(([t, label]) => (
              <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>{label}</button>
            ))}
          </div>
        )}
        {tab === 'products' && <ProductsTab />}
        {tab === 'settings' && <SettingsTab onEmailChange={setEmail} />}
        {tab === 'clicks' && <ClicksTab />}
      </main>
    </>
  );
}

// Native <dialog>: focus trap, Esc and backdrop come for free
function Modal({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return (
    <dialog ref={ref} className="modal" onClose={onClose}
            onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {children}
    </dialog>
  );
}

function ProductsTab() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | product being edited

  const load = () => api('/api/admin/products').then(setList).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);
  const done = (text) => { setModal(null); setMsg(text); load(); };

  async function toggle(p) {
    await api(`/api/admin/products/${p.id}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    }).catch((e) => setMsg(e.message));
    load();
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name} (${p.packSize})"? This cannot be undone.`)) return;
    await api(`/api/admin/products/${p.id}`, { method: 'DELETE' }).catch((e) => setMsg(e.message));
    load();
  }

  return (
    <>
      <div className="table-head">
        <h2>All products</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ Add product</button>
      </div>
      {msg && <p className="muted note" style={{ marginBottom: 12 }}>{msg}</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Image</th><th>Name</th><th>Pack size</th><th className="right">Price</th><th>Status</th><th className="right">Actions</th></tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan="6" className="muted">No products yet.</td></tr>}
            {list.map((p) => (
              <tr key={p.id}>
                <td><img src={p.imageUrl} alt="" className="thumb" /></td>
                <td><strong>{p.name}</strong>{p.description && <div className="muted" style={{ fontSize: 13 }}>{p.description}</div>}</td>
                <td>{p.packSize}</td>
                <td className="right">₹{p.price.toLocaleString('en-IN')}</td>
                <td><span className={p.isActive ? 'pill on' : 'pill off'}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="actions">
                    <button className="btn btn-outline btn-sm" onClick={() => toggle(p)}>{p.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setModal(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === 'add'
            ? <AddProductForm onDone={() => done('Product added.')} onCancel={() => setModal(null)} />
            : <EditProductForm product={modal} onDone={() => done('Product updated.')} onCancel={() => setModal(null)} />}
        </Modal>
      )}
    </>
  );
}

function AddProductForm({ onDone, onCancel }) {
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const emptyRow = { packSize: '', price: '' };
  const [rows, setRows] = useState([emptyRow]);
  const setRow = (i, key, value) => setRows(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  async function add(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const fd = new FormData(e.target);
      fd.set('variants', JSON.stringify(rows));
      await api('/api/admin/products', { method: 'POST', body: fd }); // browser sets multipart header
      onDone();
    } catch (err) { setMsg(err.message); setBusy(false); }
  }

  return (
    <form onSubmit={add} className="admin-form">
      <h2>Add product</h2>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" required />
      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" rows="2" />
      <label>Quantities (pack size and price in ₹)</label>
      {rows.map((r, i) => (
        <div key={i} className="variant-row">
          <input aria-label={`Pack size ${i + 1}`} placeholder="e.g. 500 ml" required
                 value={r.packSize} onChange={(e) => setRow(i, 'packSize', e.target.value)} />
          <input aria-label={`Price ${i + 1}`} placeholder="Price" type="number" min="1" step="1" required
                 value={r.price} onChange={(e) => setRow(i, 'price', e.target.value)} />
          {rows.length > 1 && (
            <button type="button" className="btn btn-outline btn-sm" aria-label={`Remove quantity ${i + 1}`}
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
          )}
        </div>
      ))}
      {rows.length < 10 && (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setRows([...rows, emptyRow])}>+ Add quantity</button>
      )}
      <label htmlFor="image">Image (jpg, png, webp, max 3 MB)</label>
      <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required
             onChange={(e) => setPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : '')} />
      {preview && <img src={preview} alt="Preview" className="preview" />}
      {msg && <p className="error note">{msg}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Add product'}</button>
      </div>
    </form>
  );
}

function EditProductForm({ product, onDone, onCancel }) {
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState(product.imageUrl);
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const fd = new FormData(e.target);
      if (!fd.get('image')?.size) fd.delete('image'); // no new file: keep the current image
      await api(`/api/admin/products/${product.id}`, { method: 'PUT', body: fd });
      onDone();
    } catch (err) { setMsg(err.message); setBusy(false); }
  }

  return (
    <form onSubmit={save} className="admin-form">
      <h2>Edit product</h2>
      <label htmlFor="e-name">Name</label>
      <input id="e-name" name="name" required defaultValue={product.name} />
      <label htmlFor="e-description">Description</label>
      <textarea id="e-description" name="description" rows="2" defaultValue={product.description || ''} />
      <div className="variant-row">
        <div>
          <label htmlFor="e-pack">Pack size</label>
          <input id="e-pack" name="packSize" required defaultValue={product.packSize} />
        </div>
        <div>
          <label htmlFor="e-price">Price (₹)</label>
          <input id="e-price" name="price" type="number" min="1" step="1" required defaultValue={product.price} />
        </div>
      </div>
      <label htmlFor="e-image">New image (optional)</label>
      <input id="e-image" name="image" type="file" accept="image/jpeg,image/png,image/webp"
             onChange={(e) => setPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : product.imageUrl)} />
      {preview && <img src={preview} alt="Preview" className="preview" />}
      {msg && <p className="error note">{msg}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
      </div>
    </form>
  );
}

const FIELDS = [
  ['whatsappNumber', 'WhatsApp number (with country code, e.g. 919XXXXXXXXX)'],
  ['phone', 'Phone number'],
  ['address', 'Address'],
  ['hours', 'Operating hours, e.g. Mon–Sun: 6:00 AM – 8:00 PM (leave blank to hide)'],
  ['fssaiNumber', 'FSSAI number (leave blank to hide)'],
  ['facebookUrl', 'Facebook link'],
  ['instagramUrl', 'Instagram link'],
  ['youtubeUrl', 'YouTube link'],
];

function SettingsTab({ onEmailChange }) {
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { api('/api/settings').then(setForm).catch((e) => setMsg(e.message)); }, []);

  async function save(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxCartQty: Number(form.maxCartQty) }),
      });
      setMsg('Settings saved.');
    } catch (err) { setMsg(err.message); }
  }

  if (!form) return <p className="muted">{msg || 'Loading...'}</p>;
  return (
    <div className="settings-grid">
      <form onSubmit={save} className="admin-form">
        <h2>Site settings</h2>
        {FIELDS.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={key}>{label}</label>
            <input id={key} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <label htmlFor="maxCartQty">Max quantity a customer can add per item (1–99)</label>
        <input id="maxCartQty" type="number" min="1" max="99" step="1" required value={form.maxCartQty ?? ''}
               onChange={(e) => setForm({ ...form, maxCartQty: e.target.value })} />
        <button className="btn btn-primary">Save</button>
        {msg && <p className="muted note">{msg}</p>}
      </form>
      <AccountForm onEmailChange={onEmailChange} />
    </div>
  );
}

function AccountForm({ onEmailChange }) {
  const [form, setForm] = useState({ email: '', currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => { api('/api/admin/me').then((r) => setForm((f) => ({ ...f, email: r.email || '' }))).catch(() => {}); }, []);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setMsg('');
    if (form.newPassword !== form.confirm) return setMsg('New passwords do not match');
    try {
      await api('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      onEmailChange(form.email.trim().toLowerCase());
      setForm({ ...form, currentPassword: '', newPassword: '', confirm: '' });
      setMsg('Login details updated.');
    } catch (err) { setMsg(err.message); }
  }

  return (
    <form onSubmit={save} className="admin-form">
      <h2>Admin login</h2>
      <label htmlFor="acc-email">Email</label>
      <input id="acc-email" type="email" required autoComplete="username" value={form.email} onChange={set('email')} />
      <label htmlFor="acc-new">New password (min 8 characters, leave blank to keep current)</label>
      <input id="acc-new" type="password" minLength={8} autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} />
      <label htmlFor="acc-confirm">Confirm new password</label>
      <input id="acc-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
      <label htmlFor="acc-current">Current password (required to save)</label>
      <input id="acc-current" type="password" required autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
      <button className="btn btn-primary">Update login</button>
      {msg && <p className="muted note">{msg}</p>}
    </form>
  );
}

const RANGES = [['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['6m', 'Last 6 months'], ['all', 'All time'], ['custom', 'Custom']];

// { from, to } ISO strings for the chosen range; custom dates are whole local days
function rangeToDates(range, start, end) {
  const d = new Date();
  if (range === '7d') d.setDate(d.getDate() - 7);
  else if (range === '30d') d.setDate(d.getDate() - 30);
  else if (range === '6m') d.setMonth(d.getMonth() - 6);
  else if (range === 'custom') {
    return {
      from: start ? new Date(`${start}T00:00:00`).toISOString() : undefined,
      to: end ? new Date(`${end}T23:59:59.999`).toISOString() : undefined,
    };
  } else return {};
  return { from: d.toISOString() };
}

function ClicksTab() {
  const [clicks, setClicks] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30d');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [names, setNames] = useState([]);
  const [picked, setPicked] = useState([]);
  const [ddOpen, setDdOpen] = useState(false);
  const closeDd = () => setDdOpen(false);
  const ddRef = useDismiss(ddOpen, closeDd);

  useEffect(() => { api('/api/admin/clicks/products').then(setNames).catch(() => {}); }, []);
  useEffect(() => {
    const q = new URLSearchParams();
    const { from, to } = rangeToDates(range, start, end);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    if (picked.length) q.set('products', picked.join('|'));
    setError('');
    api(`/api/admin/clicks?${q}`).then(setClicks).catch((e) => { setError(e.message); setClicks([]); });
  }, [range, start, end, picked]);

  const togglePick = (n) => setPicked(picked.includes(n) ? picked.filter((x) => x !== n) : [...picked, n]);
  const sum = (clicks || []).reduce((s, c) => s + c.total, 0);

  return (
    <>
      <h2 style={{ marginBottom: 6 }}>Analytics</h2>
      <div className="filters">
        <div className="chips" role="group" aria-label="Date range">
          {RANGES.map(([key, label]) => (
            <button key={key} className={range === key ? 'tab active' : 'tab'} aria-pressed={range === key} onClick={() => setRange(key)}>{label}</button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="dates">
            <input type="date" aria-label="From date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)} />
            <span className="muted">to</span>
            <input type="date" aria-label="To date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
          </div>
        )}
        <div className="dropdown" ref={ddRef}>
          <button className="btn btn-outline btn-sm" aria-expanded={ddOpen} onClick={() => setDdOpen(!ddOpen)}>
            {picked.length ? `${picked.length} product${picked.length > 1 ? 's' : ''} selected` : 'All products'} ▾
          </button>
          {ddOpen && (
            <div className="menu">
              {names.length === 0 && <p className="muted check">No orders yet.</p>}
              {picked.length > 0 && <button onClick={() => setPicked([])}>Clear selection</button>}
              {names.map((n) => (
                <label key={n} className="check">
                  <input type="checkbox" checked={picked.includes(n)} onChange={() => togglePick(n)} /> {n}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {!clicks ? <p className="muted">Loading...</p> : (
        <>
          <p className="summary">
            {clicks.length} order tap{clicks.length === 1 ? '' : 's'} · ₹{sum.toLocaleString('en-IN')} total
            {clicks.length === 500 ? ' (showing latest 500)' : ''}
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date &amp; time</th><th>Items</th><th className="right">Total</th><th>Location</th></tr></thead>
              <tbody>
                {clicks.length === 0 && <tr><td colSpan="4" className="muted">No clicks in this range.</td></tr>}
                {clicks.map((c) => (
                  <tr key={c.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                    <td>{c.items.map((it) => <div key={it.id}>{it.productName} × {it.qty}</div>)}</td>
                    <td className="right">₹{c.total.toLocaleString('en-IN')}</td>
                    <td className="muted">{c.address || 'Location not shared'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
