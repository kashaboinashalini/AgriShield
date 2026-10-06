import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, btnGhost, Field, fmtDateTime } from '../components/ui';

export default function Markets() {
  const [filters, setFilters] = useState<any>({ crop: 'Rice', state: '', district: '', market: '' });
  const [options, setOptions] = useState<any>({ crops: [], markets: [], districts: [] });
  const [meta, setMeta] = useState<any>({});
  const [rows, setRows] = useState<any[] | null>(null);
  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const set = (k: string) => (e: any) => setFilters({ ...filters, [k]: e.target.value });

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const q = new URLSearchParams();
      if (filters.crop) q.set('crop', filters.crop);
      if (filters.state) q.set('state', filters.state);
      if (filters.district) q.set('district', filters.district);
      if (filters.market) q.set('market', filters.market);
      const qs = q.toString();
      const [p, t] = await Promise.all([
        api.get(`/markets/prices?${qs}`),
        api.get(`/markets/trends?crop=${encodeURIComponent(filters.crop || '')}${filters.market ? `&market=${encodeURIComponent(filters.market)}` : ''}`),
      ]);
      const pb = p.data.data;
      setRows(pb.data || []);
      setOptions(pb.options || { crops: [], markets: [], districts: [] });
      setMeta({ demo: pb.demo, label: pb.label, source: pb.source });
      setTrend(t.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Could not load market data.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const lastUpdated = rows && rows.length > 0
    ? rows.reduce((m: string, r: any) => (r.date > m ? r.date : m), rows[0].date)
    : null;

  const stateOptions = rows ? [...new Set(rows.map((r: any) => r.state).filter(Boolean))] : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Market Price Intelligence"
        subtitle="Government market prices and price trends"
        actions={<button onClick={load} disabled={loading} className={btnPrimary}>⟳ Refresh</button>}
      />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <Card>
        <div className="flex flex-wrap gap-2 items-end">
          <Field label="Crop">
            <select className={inputCls} value={filters.crop} onChange={set('crop')}>
              <option value="">All crops</option>
              {(options.crops || []).map((c: string) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="State">
            <select className={inputCls} value={filters.state} onChange={set('state')}>
              <option value="">All states</option>
              {stateOptions.map((s: string) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="District">
            <select className={inputCls} value={filters.district} onChange={set('district')}>
              <option value="">All districts</option>
              {(options.districts || []).map((d: any) => <option key={typeof d === 'string' ? d : (d.district || d)}>{typeof d === 'string' ? d : (d.district || d)}</option>)}
            </select>
          </Field>
          <Field label="Market">
            <select className={inputCls} value={filters.market} onChange={set('market')}>
              <option value="">All markets</option>
              {(options.markets || []).map((m: string) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <button onClick={load} disabled={loading} className={btnGhost}>Apply Filters</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {meta.demo
            ? <DataLabel type="demo" source={meta.label || 'Reference dataset'} />
            : <DataLabel type="latest" source={meta.source || 'Government Market Data'} />}
          {lastUpdated && <span className="text-xs text-gray-400">Last updated: {fmtDateTime(lastUpdated)}</span>}
        </div>
      </Card>
      {loading ? <Spinner /> : !rows || rows.length === 0 ? <Empty text="No market prices found for these filters." /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th>Crop</th><th>State</th><th>District</th><th>Market</th><th>Arrival Date</th><th>Min ₹</th><th>Max ₹</th><th>Modal ₹</th><th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r._id} className="border-t">
                    <td>{r.crop}</td>
                    <td>{r.state}</td>
                    <td>{r.district}</td>
                    <td>{r.market}</td>
                    <td>{fmtDateTime(r.date)}</td>
                    <td>₹{Number(r.minimumPrice).toLocaleString('en-IN')}</td>
                    <td>₹{Number(r.maximumPrice).toLocaleString('en-IN')}</td>
                    <td><b>₹{Number(r.pricePerKg).toLocaleString('en-IN')}</b></td>
                    <td>{r.unit || 'kg'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Card className="h-80">
        <h2 className="font-bold mb-2">Price Trend — {trend?.crop || filters.crop || 'all crops'}{trend?.market ? ` @ ${trend.market}` : ''}</h2>
        {loading ? <Spinner /> : !trend || !trend.series || trend.series.length === 0 ? (
          <Empty text="No trend data available." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#15803d" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
