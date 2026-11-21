'use client';
import { useEffect, useState } from 'react';
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

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('products');
  async function logout() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    onLogout();
  }
  return (
    <div className="container admin-box wide">
      <div className="admin-top">
        <div className="admin-brand">
          <img src="/logo.webp" alt="" />
          <h1>Admin</h1>
        </div>
        <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
      </div>
      <div className="tabs">
        {['products', 'settings', 'clicks'].map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            {t === 'clicks' ? 'WhatsApp clicks' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'products' && <ProductsTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'clicks' && <ClicksTab />}
    </div>
  );
}

function ProductsTab() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/api/admin/products').then(setList).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    const formEl = e.target;
    setBusy(true); setMsg('');
    try {
      await api('/api/admin/products', { method: 'POST', body: new FormData(formEl) }); // browser sets multipart header
      formEl.reset(); setPreview(''); setMsg('Product added.'); load();
    } catch (err) { setMsg(err.message); }
    setBusy(false);
  }

  async function toggle(p) {
    await api(`/api/admin/products/${p.id}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    }).catch((e) => setMsg(e.message));
    load();
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await api(`/api/admin/products/${p.id}`, { method: 'DELETE' }).catch((e) => setMsg(e.message));
    load();
  }

  return (
    <>
      <form onSubmit={add} className="admin-form">
        <h2>Add product</h2>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required />
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows="2" />
        <label htmlFor="price">Price (₹, whole number)</label>
        <input id="price" name="price" type="number" min="1" step="1" required />
        <label htmlFor="packSize">Pack size (e.g. 500 ml)</label>
        <input id="packSize" name="packSize" required />
        <label htmlFor="image">Image (jpg, png, webp, max 3 MB)</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required
               onChange={(e) => setPreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : '')} />
        {preview && <img src={preview} alt="Preview" className="preview" />}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Add product'}</button>
        {msg && <p className="muted note">{msg}</p>}
      </form>

      <h2 style={{ marginBottom: 14 }}>All products</h2>
      {list.length === 0 && <p className="muted">No products yet.</p>}
      {list.map((p) => (
        <div key={p.id} className="row">
          <img src={p.imageUrl} alt={p.name} className="thumb" />
          <div className="row-info">
            <strong>{p.name}</strong>
            <span className="muted">₹{p.price} · {p.packSize} · <span className={p.isActive ? 'pill on' : 'pill off'}>{p.isActive ? 'Active' : 'Inactive'}</span></span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => toggle(p)}>{p.isActive ? 'Deactivate' : 'Activate'}</button>
          <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
        </div>
      ))}
    </>
  );
}

const FIELDS = [
  ['whatsappNumber', 'WhatsApp number (with country code, e.g. 919XXXXXXXXX)'],
  ['phone', 'Phone number'],
  ['address', 'Address'],
  ['facebookUrl', 'Facebook link'],
  ['instagramUrl', 'Instagram link'],
  ['youtubeUrl', 'YouTube link'],
];

function SettingsTab() {
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
        body: JSON.stringify(form),
      });
      setMsg('Settings saved.');
    } catch (err) { setMsg(err.message); }
  }

  if (!form) return <p className="muted">Loading...</p>;
  return (
    <form onSubmit={save} className="admin-form">
      {FIELDS.map(([key, label]) => (
        <div key={key}>
          <label htmlFor={key}>{label}</label>
          <input id={key} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        </div>
      ))}
      <button className="btn btn-primary">Save</button>
      {msg && <p className="muted note">{msg}</p>}
    </form>
  );
}

function ClicksTab() {
  const [clicks, setClicks] = useState(null);
  useEffect(() => { api('/api/admin/clicks').then(setClicks).catch(() => setClicks([])); }, []);
  if (!clicks) return <p className="muted">Loading...</p>;
  return (
    <>
      <h2 style={{ marginBottom: 6 }}>Recent Buy taps</h2>
      <p className="muted" style={{ marginBottom: 16 }}>Shows which product was tapped and when. Customer details are in your WhatsApp chats.</p>
      {clicks.length === 0 && <p className="muted">No clicks yet.</p>}
      {clicks.map((c) => (
        <div key={c.id} className="row">
          <strong>{c.productName}</strong>
          <span className="muted">{new Date(c.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
        </div>
      ))}
    </>
  );
}
