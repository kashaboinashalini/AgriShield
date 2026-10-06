import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { Card, PageHeader, Field, inputCls, btnPrimary, fmtDateTime } from '../components/ui';
import { CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '', mobile: user?.mobile || '',
    state: user?.state || '', district: user?.district || '', village: user?.village || '',
    preferredLanguage: user?.preferredLanguage || 'English',
    primaryCrop: user?.primaryCrop || '', soilType: user?.soilType || '', farmSize: user?.farmSize ?? '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg(''); setBusy(true);
    try {
      await updateProfile({ ...form, farmSize: Number(form.farmSize) || undefined });
      setMsg('Profile updated successfully.');
    } catch (e: any) {
      setErr(errMsg(e, 'Profile update failed.'));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg(''); setBusy(true);
    try {
      await changePassword(pw.currentPassword, pw.newPassword);
      setMsg('Password changed successfully.');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (e: any) {
      setErr(errMsg(e, 'Password change failed.'));
    } finally {
      setBusy(false);
    }
  };

  const info = (label: string, value: any) => (
    <div className="border-b border-gray-50 py-2 last:border-0">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-semibold">{value || '—'}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Profile" subtitle="Your account and farm profile information" />
      {err && <Card className="text-red-600 text-sm">{err}</Card>}
      {msg && <Card className="text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} /> {msg}</Card>}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold mb-2">Account Information</h3>
          {info('Full Name', user?.fullName)}
          {info('Email', user?.email)}
          {info('Phone', user?.mobile)}
          {info('Role', user?.role === 'expert' ? 'Agriculture Expert' : user?.role === 'admin' ? 'Admin' : 'Farmer')}
          {info('Joined', user?.createdAt ? fmtDateTime(user.createdAt) : '—')}
        </Card>

        <Card>
          <h3 className="font-bold mb-2">Location & Farm Profile</h3>
          {info('State', user?.state)}
          {info('District', user?.district)}
          {info('Village', user?.village)}
          {info('Preferred Language', user?.preferredLanguage)}
          {info('Primary Crop', user?.primaryCrop)}
          {info('Soil Type', user?.soilType)}
          {info('Farm Size', user?.farmSize ? `${user.farmSize} acres` : '—')}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold mb-3">Update Profile</h3>
          <form onSubmit={saveProfile} className="space-y-3">
            <Field label="Full Name"><input className={inputCls} value={form.fullName} onChange={set('fullName')} /></Field>
            <Field label="Phone"><input className={inputCls} value={form.mobile} onChange={set('mobile')} /></Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="State"><input className={inputCls} value={form.state} onChange={set('state')} /></Field>
              <Field label="District"><input className={inputCls} value={form.district} onChange={set('district')} /></Field>
              <Field label="Village"><input className={inputCls} value={form.village} onChange={set('village')} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Preferred Language">
                <select className={inputCls} value={form.preferredLanguage} onChange={set('preferredLanguage')}>
                  <option>English</option><option>తెలుగు</option>
                </select>
              </Field>
              <Field label="Farm Size (acres)"><input type="number" className={inputCls} value={form.farmSize} onChange={set('farmSize')} /></Field>
            </div>
            <Field label="Primary Crop"><input className={inputCls} value={form.primaryCrop} onChange={set('primaryCrop')} /></Field>
            <Field label="Soil Type">
              <select className={inputCls} value={form.soilType} onChange={set('soilType')}>
                <option value="">Select…</option>
                {['Black Soil', 'Red Soil', 'Alluvial Soil', 'Loamy Soil', 'Sandy Soil', 'Clay Soil', 'Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <button disabled={busy} className={btnPrimary}>{busy ? 'Saving…' : 'Update Profile'}</button>
          </form>
        </Card>

        <Card>
          <h3 className="font-bold mb-3">Change Password</h3>
          <form onSubmit={savePassword} className="space-y-3">
            <Field label="Current Password">
              <input type="password" required className={inputCls} value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <Field label="New Password (min 6 characters)">
              <input type="password" required minLength={6} className={inputCls} value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} />
            </Field>
            <button disabled={busy} className={btnPrimary}>{busy ? 'Updating…' : 'Change Password'}</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
