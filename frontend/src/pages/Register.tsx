import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { inputCls } from '../components/ui';

const ROLES = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'expert', label: 'Agriculture Expert' },
  { value: 'admin', label: 'Admin' },
];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: '', mobile: '', email: '', password: '',
    state: '', district: '', village: '', role: 'farmer', preferredLanguage: 'English',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await register(form);
      nav('/dashboard');
    } catch (e: any) {
      setErr(errMsg(e, 'Registration failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-green-700 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 md:p-8 max-h-[92vh] overflow-y-auto">
        <h1 className="text-3xl font-extrabold text-green-900 text-center">🌾 AgriShield AI</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Create your farmer account</p>

        <form onSubmit={submit} className="space-y-3">
          <input required placeholder="Full Name *" className={inputCls} value={form.fullName} onChange={set('fullName')} />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Phone *" className={inputCls} value={form.mobile} onChange={set('mobile')} />
            <input required type="email" placeholder="Email *" className={inputCls} value={form.email} onChange={set('email')} />
          </div>
          <input required type="password" minLength={6} placeholder="Password (min 6 characters) *" className={inputCls} value={form.password} onChange={set('password')} />
          <div className="grid grid-cols-3 gap-3">
            <input required placeholder="State *" className={inputCls} value={form.state} onChange={set('state')} />
            <input required placeholder="District *" className={inputCls} value={form.district} onChange={set('district')} />
            <input required placeholder="Village *" className={inputCls} value={form.village} onChange={set('village')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={form.role} onChange={set('role')}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select className={inputCls} value={form.preferredLanguage} onChange={set('preferredLanguage')}>
              <option>English</option>
              <option>తెలుగు</option>
            </select>
          </div>
          <p className="text-[11px] text-gray-400">Default role is Farmer. Agriculture Experts and Admins get additional capabilities.</p>
          {err && <div className="text-red-600 text-sm bg-red-50 rounded-xl p-2.5">{err}</div>}
          <button disabled={busy} className="w-full rounded-xl bg-green-700 text-white font-bold py-3 hover:bg-green-800 disabled:opacity-50">
            {busy ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered?{' '}
          <Link to="/login" className="text-green-700 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
