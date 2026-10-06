import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { Card, PageHeader, DataLabel } from '../components/ui';
import { Languages, Ruler, Palette, Bell, MapPin, User, LogOut } from 'lucide-react';

const NOTIF_TYPES = [
  { key: 'weather', label: 'Weather Alerts' },
  { key: 'disease', label: 'Disease Risk' },
  { key: 'pest', label: 'Pest Alerts' },
  { key: 'irrigation', label: 'Irrigation Reminders' },
  { key: 'task', label: 'Farm Tasks' },
  { key: 'market', label: 'Market Updates' },
  { key: 'scheme', label: 'Government Schemes' },
  { key: 'system', label: 'System Notifications' },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-green-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const [units, setUnits] = useState(() => localStorage.getItem('agrishield-units') || 'acres');
  const [theme, setTheme] = useState(() => localStorage.getItem('agrishield-theme') || 'light');
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('agrishield-notif-prefs') || '{}'); } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem('agrishield-units', units); }, [units]);
  useEffect(() => {
    localStorage.setItem('agrishield-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  useEffect(() => { localStorage.setItem('agrishield-notif-prefs', JSON.stringify(prefs)); }, [prefs]);

  const togglePref = (k: string) => setPrefs(p => ({ ...p, [k]: !(p[k] ?? true) }));

  const row = (icon: React.ReactNode, label: string, control: React.ReactNode, hint?: string) => (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="text-green-700">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="text-[11px] text-gray-400">{hint}</div>}
      </div>
      {control}
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Application preferences — stored on this device" />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold mb-1">General</h3>
          <DataLabel type="database" source="Local device settings" />
          <div className="mt-2">
            {row(<Languages size={17} />, 'Language',
              <div className="flex rounded-xl overflow-hidden border text-sm">
                <button className={`px-3 py-1.5 ${lang === 'en' ? 'bg-green-700 text-white' : ''}`} onClick={() => setLang('en')}>English</button>
                <button className={`px-3 py-1.5 ${lang === 'te' ? 'bg-green-700 text-white' : ''}`} onClick={() => setLang('te')}>తెలుగు</button>
              </div>,
              'Interface language (English / Telugu)')}
            {row(<Ruler size={17} />, 'Units',
              <div className="flex rounded-xl overflow-hidden border text-sm">
                <button className={`px-3 py-1.5 ${units === 'acres' ? 'bg-green-700 text-white' : ''}`} onClick={() => setUnits('acres')}>Acres</button>
                <button className={`px-3 py-1.5 ${units === 'hectares' ? 'bg-green-700 text-white' : ''}`} onClick={() => setUnits('hectares')}>Hectares</button>
              </div>,
              'Area units used across the app')}
            {row(<Palette size={17} />, 'Theme',
              <div className="flex rounded-xl overflow-hidden border text-sm">
                <button className={`px-3 py-1.5 ${theme === 'light' ? 'bg-green-700 text-white' : ''}`} onClick={() => setTheme('light')}>Light</button>
                <button className={`px-3 py-1.5 ${theme === 'dark' ? 'bg-green-700 text-white' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
              </div>)}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-1">Notifications</h3>
          <p className="text-[11px] text-gray-400 mb-2">Choose which alert types you want to see.</p>
          {NOTIF_TYPES.map(nt => row(
            <Bell size={17} />, nt.label,
            <Toggle on={prefs[nt.key] ?? true} onClick={() => togglePref(nt.key)} />
          ))}
        </Card>

        <Card>
          <h3 className="font-bold mb-1">Location</h3>
          <p className="text-xs text-gray-500 mt-1">
            Your profile location is used for weather, risk assessment and market data.
          </p>
          <div className="mt-2 text-sm space-y-1">
            <div><span className="text-gray-400">State: </span><b>{user?.state || '—'}</b></div>
            <div><span className="text-gray-400">District: </span><b>{user?.district || '—'}</b></div>
            <div><span className="text-gray-400">Village: </span><b>{user?.village || '—'}</b></div>
          </div>
          <p className="text-xs mt-2">
            Change your location in{' '}
            <span className="text-green-700 font-semibold">Profile</span>.
            Farms store precise coordinates — add them in My Farms.
          </p>
        </Card>

        <Card>
          <h3 className="font-bold mb-1">Account</h3>
          <div className="mt-2 text-sm space-y-1">
            <div><span className="text-gray-400">Name: </span><b>{user?.fullName}</b></div>
            <div><span className="text-gray-400">Email: </span><b>{user?.email}</b></div>
            <div><span className="text-gray-400">Role: </span><b>{user?.role === 'expert' ? 'Agriculture Expert' : user?.role === 'admin' ? 'Admin' : 'Farmer'}</b></div>
          </div>
          <div className="mt-3 space-y-2">
            <button onClick={logout} className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
