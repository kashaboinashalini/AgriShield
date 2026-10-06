import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Leaf, ScanLine, Bug, Sprout, TrendingUp, Droplets, CloudSun, ShieldAlert, ShieldAlert as DisasterIcon,
  Calculator, CalendarDays, MessageSquare, Landmark, Satellite, MapPin, Bell, BarChart3, User, Settings,
  LogOut, Menu, X, Search, Languages, ChevronDown, Leaf as CropHealthIcon, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { api } from '../services/api';

const navItems = [
  { to: '/dashboard', labelKey: 'dashboard', icon: Home },
  { to: '/farms', labelKey: 'myFarms', icon: Leaf },
  { to: '/crop-health', labelKey: 'cropHealth', icon: CropHealthIcon },
  { to: '/scanner', labelKey: 'diseaseDetection', icon: ScanLine },
  { to: '/pests', labelKey: 'pestDetection', icon: Bug },
  { to: '/soil', labelKey: 'soilHealth', icon: Sprout },
  { to: '/recommend', labelKey: 'cropRecommendation', icon: TrendingUp },
  { to: '/irrigation', labelKey: 'irrigation', icon: Droplets },
  { to: '/weather', labelKey: 'weather', icon: CloudSun },
  { to: '/risk', labelKey: 'riskAlerts', icon: Activity },
  { to: '/disasters', labelKey: 'disasterAlerts', icon: DisasterIcon },
  { to: '/markets', labelKey: 'marketPrices', icon: TrendingUp },
  { to: '/profit', labelKey: 'profitCalculator', icon: Calculator },
  { to: '/calendar', labelKey: 'farmCalendar', icon: CalendarDays },
  { to: '/assistant', labelKey: 'aiAssistant', icon: MessageSquare },
  { to: '/schemes', labelKey: 'governmentSchemes', icon: Landmark },
  { to: '/satellite', labelKey: 'satelliteAnalysis', icon: Satellite },
  { to: '/map', labelKey: 'farmMap', icon: MapPin },
  { to: '/analytics', labelKey: 'analytics', icon: BarChart3 },
  { to: '/notifications', labelKey: 'notifications', icon: Bell },
  { to: '/profile', labelKey: 'profile', icon: User },
  { to: '/settings', labelKey: 'settings', icon: Settings },
];

const ROLE_LABEL: Record<string, string> = { farmer: 'Farmer', expert: 'Agriculture Expert', admin: 'Admin' };

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [unread, setUnread] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const nav = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<any>(null);

  const refreshUnread = () => api.get('/notifications').then(r => setUnread(r.data.unread || 0)).catch(() => {});
  useEffect(() => { refreshUnread(); const id = setInterval(refreshUnread, 60000); return () => clearInterval(id); }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults(null); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onSearch = (q: string) => {
    setQuery(q);
    clearTimeout(debounce.current);
    if (q.trim().length < 2) { setResults(null); return; }
    setSearching(true);
    debounce.current = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(q.trim())}`)
        .then(r => setResults(r.data.data))
        .catch(() => setResults({ empty: true }))
        .finally(() => setSearching(false));
    }, 300);
  };

  const resultCount = results && !results.empty
    ? (results.farms?.length || 0) + (results.crops?.length || 0) + (results.tasks?.length || 0) + (results.schemes?.length || 0) + (results.scans?.length || 0) + (results.markets?.length || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-green-950 text-green-50 flex flex-col transform ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
        <Link to="/dashboard" onClick={() => setOpen(false)} className="p-4 text-xl font-extrabold flex items-center gap-2 border-b border-green-800">
          <span className="text-2xl">🌾</span> AgriShield <span className="text-green-400">AI</span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 text-sm">
          {navItems.map(it => (
            <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-green-700 text-white font-semibold' : 'hover:bg-green-800 text-green-100'}`}>
              <it.icon size={16} /> {t(it.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-green-800">
          <div className="flex items-center justify-between text-xs text-green-300 mb-2">
            <span>Analyze → Predict → Protect</span>
            <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="flex items-center gap-1 hover:text-white" title="Switch language">
              <Languages size={13} /> {lang === 'en' ? 'EN' : 'TE'}
            </button>
          </div>
          <button onClick={logout} className="w-full bg-green-800 hover:bg-red-700 transition-colors rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm font-semibold">
            <LogOut size={15} /> {t('logout')}
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-green-100 px-3 md:px-6 py-2.5 flex items-center gap-2 md:gap-4">
          <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>

          {/* Global search */}
          <div ref={searchRef} className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => onSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            {results && (
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
                {searching && <div className="p-3 text-sm text-gray-400">Searching…</div>}
                {results && !searching && resultCount === 0 && <div className="p-3 text-sm text-gray-400">{t('noResults')}</div>}
                {results && !searching && resultCount > 0 && (
                  <div className="p-2 text-xs text-gray-400 border-b">{resultCount} {t('results')}</div>
                )}
                {results?.farms?.length > 0 && (
                  <div className="p-2 border-b">
                    <div className="text-[10px] font-bold text-gray-400 px-1">FARMS</div>
                    {results.farms.map((f: any) => (
                      <button key={f._id} onClick={() => { setResults(null); setQuery(''); nav('/farms'); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-green-50 text-sm flex items-center gap-2">
                        <Leaf size={13} className="text-green-600" /> {f.farmName} <span className="text-xs text-gray-400">{f.district}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results?.tasks?.length > 0 && (
                  <div className="p-2 border-b">
                    <div className="text-[10px] font-bold text-gray-400 px-1">TASKS</div>
                    {results.tasks.slice(0, 4).map((tk: any) => (
                      <button key={tk._id} onClick={() => { setResults(null); setQuery(''); nav('/calendar'); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-green-50 text-sm flex items-center gap-2">
                        <CalendarDays size={13} className="text-green-600" /> {tk.title}
                      </button>
                    ))}
                  </div>
                )}
                {results?.schemes?.length > 0 && (
                  <div className="p-2 border-b">
                    <div className="text-[10px] font-bold text-gray-400 px-1">SCHEMES</div>
                    {results.schemes.slice(0, 4).map((s: any) => (
                      <button key={s._id} onClick={() => { setResults(null); setQuery(''); nav('/schemes'); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-green-50 text-sm flex items-center gap-2">
                        <Landmark size={13} className="text-green-600" /> {s.name}
                      </button>
                    ))}
                  </div>
                )}
                {results?.scans?.length > 0 && (
                  <div className="p-2 border-b">
                    <div className="text-[10px] font-bold text-gray-400 px-1">SCANS</div>
                    {results.scans.slice(0, 4).map((s: any) => (
                      <div key={s.id} className="px-2 py-1.5 text-sm flex items-center gap-2">
                        <ScanLine size={13} className="text-green-600" /> {s.title} <span className="text-xs text-gray-400">{s.confidence}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {results?.markets?.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold text-gray-400 px-1">MARKET PRICES</div>
                    {results.markets.slice(0, 4).map((m: any, i: number) => (
                      <div key={i} className="px-2 py-1.5 text-sm flex items-center gap-2">
                        <TrendingUp size={13} className="text-green-600" /> {m.crop} — {m.market} <span className="text-xs text-gray-500">₹{m.modalPrice}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="hidden sm:flex items-center gap-1 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <Languages size={14} /> {lang === 'en' ? 'EN' : 'తె'}
            </button>
            <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-600">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center px-1">
                  {unread}
                </span>
              )}
            </Link>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-xl hover:bg-gray-50 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold">
                  {(user?.fullName || 'F')[0].toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[120px]">{user?.fullName}</div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-0.5">{ROLE_LABEL[user?.role] || 'Farmer'} <ChevronDown size={10} /></div>
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">{t('profile')}</Link>
                  <Link to="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">{t('settings')}</Link>
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">{t('logout')}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-3 md:p-6 flex-1 pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex overflow-x-auto">
          {navItems.slice(0, 10).map(it => (
            <NavLink key={it.to} to={it.to}
              className={({ isActive }) => `flex-1 min-w-[56px] flex flex-col items-center gap-0.5 py-2 text-[10px] ${isActive ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
              <it.icon size={18} />
              <span className="truncate px-1">{t(it.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
