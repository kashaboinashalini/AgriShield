import { useEffect, useRef, useState } from 'react';
import { Search, Leaf, CalendarDays, Landmark, ScanLine, TrendingUp } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Spinner, Empty, Badge, fmtDateTime } from '../components/ui';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');
  const debounce = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (q.trim().length < 2) { setResults(null); return; }
    setSearching(true);
    setErr('');
    debounce.current = setTimeout(async () => {
      try {
        const r = await api.get(`/search?q=${encodeURIComponent(q.trim())}`);
        setResults(r.data.data);
      } catch (e: any) {
        setErr(errMsg(e, 'Search failed.'));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [q]);

  const sections: { title: string; icon: any; items: any[]; render: (item: any) => React.ReactNode }[] = results && !err ? [
    {
      title: 'Farms', icon: Leaf, items: results.farms || [],
      render: (f: any) => (
        <div className="flex justify-between text-sm">
          <span className="font-semibold">{f.farmName}</span>
          <span className="text-gray-500 text-xs">{f.village}, {f.district} · {f.area} {f.unit}</span>
        </div>
      ),
    },
    {
      title: 'Crops', icon: ScanLine, items: results.crops || [],
      render: (c: any) => <div className="text-sm font-semibold">{c.name}</div>,
    },
    {
      title: 'Tasks', icon: CalendarDays, items: results.tasks || [],
      render: (t: any) => (
        <div className="flex justify-between text-sm">
          <span className="font-semibold">{t.title}</span>
          <span className="text-xs text-gray-500">{new Date(t.dueDate).toLocaleDateString('en-IN')} {t.status === 'completed' && <Badge level="LOW">DONE</Badge>}</span>
        </div>
      ),
    },
    {
      title: 'Government Schemes', icon: Landmark, items: results.schemes || [],
      render: (s: any) => (
        <div className="text-sm">
          <span className="font-semibold">{s.name}</span>
          <span className="text-xs text-gray-500"> — {s.state}</span>
        </div>
      ),
    },
    {
      title: 'Scans', icon: ScanLine, items: results.scans || [],
      render: (s: any) => (
        <div className="flex justify-between text-sm">
          <span className="font-semibold">{s.title}</span>
          <span className="text-xs text-gray-500">{s.confidence}% · {fmtDateTime(s.date)}</span>
        </div>
      ),
    },
    {
      title: 'Market Prices', icon: TrendingUp, items: results.markets || [],
      render: (m: any) => (
        <div className="flex justify-between text-sm">
          <span className="font-semibold">{m.crop} — {m.market}</span>
          <span className="text-xs text-gray-500">₹{m.modalPrice ?? m.pricePerKg}{m.state ? ` · ${m.state}` : ''}</span>
        </div>
      ),
    },
  ] : [];

  const total = sections.reduce((a, s) => a + s.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search farms, crops, tasks, schemes, scans, market data…"
          className="w-full border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {err && <Card className="text-red-600 text-sm">{err}</Card>}
      {searching && <Spinner />}

      {results && !searching && total === 0 && <Card><Empty text={`No results found for "${q}".`} /></Card>}

      {results && !searching && total > 0 && (
        <>
          <div className="text-sm text-gray-500">{total} result{total === 1 ? '' : 's'} for "{results.query}"</div>
          {sections.filter(s => s.items.length > 0).map((s, i) => (
            <Card key={i}>
              <h3 className="font-bold mb-2 flex items-center gap-1.5 text-sm">
                <s.icon size={15} className="text-green-700" /> {s.title}
                <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-normal">{s.items.length}</span>
              </h3>
              <div className="space-y-1.5">
                {s.items.slice(0, 8).map((item: any, j: number) => (
                  <div key={j} className="border-b border-gray-50 pb-1.5 last:border-0 last:pb-0">
                    {s.render(item)}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </>
      )}

      {!results && !searching && !err && (
        <Card><Empty text="Type at least 2 characters to search across your farm data." /></Card>
      )}
    </div>
  );
}
