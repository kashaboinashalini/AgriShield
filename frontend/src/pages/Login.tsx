import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      nav('/dashboard');
    } catch (e: any) {
      setErr(errMsg(e, 'Invalid email or password.'));
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setErr('');
    setBusy(true);
    try {
      await demoLogin(); // authenticates demo@agrishield.ai / Demo@123 via the normal auth flow
      nav('/dashboard');
    } catch (e: any) {
      setErr(errMsg(e, 'Demo login failed. Run `npm run seed` in the backend first.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-green-700 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-green-900 text-center">🌾 AgriShield AI</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Analyze → Predict → Recommend → Protect → Improve</p>

        <button
          onClick={demo}
          disabled={busy}
          className="w-full mb-4 rounded-xl bg-amber-400 text-green-950 font-bold py-3 shadow hover:bg-amber-300 disabled:opacity-50"
        >
          👨‍🌾 Continue as Demo Farmer
        </button>
        <p className="text-center text-[11px] text-gray-400 -mt-2 mb-4">
          Demo account: demo@agrishield.ai / Demo@123 (real login through the backend)
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            required type="email" placeholder="Email"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            required type="password" placeholder="Password"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          {err && <div className="text-red-600 text-sm bg-red-50 rounded-xl p-2.5">{err}</div>}
          <button disabled={busy} className="w-full rounded-xl bg-green-700 text-white font-bold py-3 hover:bg-green-800 disabled:opacity-50">
            {busy ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          New farmer?{' '}
          <Link to="/register" className="text-green-700 font-semibold hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
