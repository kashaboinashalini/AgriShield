import { useEffect, useState } from 'react';
import { Landmark, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, Badge, fmtDateTime } from '../components/ui';

export default function Schemes() {
  const [filters, setFilters] = useState<any>({ state: '', farmerType: '', crop: '', landSize: '' });
  const [data, setData] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const set = (k: string) => (e: any) => setFilters({ ...filters, [k]: e.target.value });

  const load = () => {
    setErr('');
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as any).toString();
    api.get(`/schemes?${q}`)
      .then(r => { setData(r.data.data || []); if (selected) { const still = (r.data.data || []).find((s: any) => s._id === selected._id); setSelected(still || null); } })
      .catch(e => setErr(errMsg(e, 'Failed to load schemes.')));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div className="space-y-4">
      <PageHeader title="Government Schemes" subtitle="Official government programs for farmers — verify eligibility on the official portal" />
      {err && <Card className="text-red-600 text-sm">{err}</Card>}

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="State (e.g. Telangana)" className={inputCls} value={filters.state} onChange={set('state')} />
          <select className={inputCls} value={filters.farmerType} onChange={set('farmerType')}>
            <option value="">All farmer types</option>
            <option>All</option><option>Small</option><option>Marginal</option>
          </select>
          <input placeholder="Crop (e.g. Rice)" className={inputCls} value={filters.crop} onChange={set('crop')} />
          <input placeholder="Land size (e.g. 5 acres)" className={inputCls} value={filters.landSize} onChange={set('landSize')} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={load} className={btnPrimary}>Search Schemes</button>
          <DataLabel type="database" source="Government scheme directory" />
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <Info size={12} /> Informational guidance only — AgriShield does not determine legal eligibility.
        </p>
      </Card>

      {data === null ? <Spinner /> : data.length === 0 ? <Empty text="No matching schemes. Try broader filters." /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {data.map(s => (
            <Card key={s._id} className="hover:border-green-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold flex items-center gap-2"><Landmark size={16} className="text-green-700" /> {s.name}</h3>
                <Badge level="LOW">{s.state}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{s.description}</p>
              <p className="text-sm mt-2"><b>Benefits:</b> <span className="text-gray-700">{s.benefits}</span></p>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setSelected(s)} className="text-sm text-green-700 font-semibold hover:underline">
                  View details
                </button>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    Official portal <ExternalLink size={12} />
                  </a>
                )}
              </div>
              {s.lastVerified && (
                <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                  <ShieldCheck size={11} /> Last verified: {fmtDateTime(s.lastVerified)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <Card className="max-w-2xl w-full max-h-[85vh] overflow-y-auto" >
            <div onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2"><Landmark size={20} className="text-green-700" /> {selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <div className="mt-1"><DataLabel type="database" source="Government scheme directory" /></div>

              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="text-xs font-bold text-gray-500">DESCRIPTION</div>
                  <p className="text-gray-700">{selected.description}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500">BENEFITS</div>
                  <p className="text-gray-700">{selected.benefits}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500">ELIGIBILITY</div>
                  <p className="text-gray-700">{selected.eligibility}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-xs text-gray-400">State:</span> <b>{selected.state}</b></div>
                  <div><span className="text-xs text-gray-400">Farmer type:</span> <b>{selected.farmerType}</b></div>
                  <div><span className="text-xs text-gray-400">Crop:</span> <b>{selected.crop}</b></div>
                  <div><span className="text-xs text-gray-400">Land size:</span> <b>{selected.landSizeCriteria}</b></div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500">HOW TO APPLY</div>
                  <p className="text-gray-700">{selected.applicationInfo}</p>
                </div>
                {selected.url && (
                  <a href={selected.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-green-700 text-white rounded-xl px-4 py-2.5 font-semibold hover:bg-green-800">
                    Apply on the official portal <ExternalLink size={15} />
                  </a>
                )}
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <b>Potentially relevant based on your profile.</b> Always verify eligibility,
                documents required and application deadlines on the official government portal
                before applying. AgriShield does not guarantee eligibility.
              </div>
              {selected.lastVerified && (
                <div className="text-[11px] text-gray-400 mt-2">Last verified: {fmtDateTime(selected.lastVerified)}</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
