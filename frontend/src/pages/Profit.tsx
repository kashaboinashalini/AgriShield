import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, Field, fmtDateTime, inr } from '../components/ui';

const COLORS = ['#15803d', '#eab308', '#dc2626', '#3b82f6', '#a855f7', '#f97316', '#14b8a6', '#64748b'];
const NUMERIC = ['farmArea', 'expectedYield', 'sellingPrice', 'seedCost', 'fertilizerCost', 'pesticideCost', 'labourCost', 'irrigationCost', 'machineryCost', 'transportationCost', 'otherCost'];

export default function Profit() {
  const [form, setForm] = useState<any>({ farmArea: 3, unit: 'acres', crop: '', expectedYield: 28, sellingPrice: 28, seedCost: 6000, fertilizerCost: 12000, pesticideCost: 5000, labourCost: 18000, irrigationCost: 8000, machineryCost: 4000, transportationCost: 2000, otherCost: 3000 });
  const [r, setR] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [err, setErr] = useState('');
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.get('/profit')
      .then(res => setHistory(res.data.data))
      .catch((e: any) => setErr(errMsg(e, 'Could not load calculation history.')))
      .finally(() => setInitial(false));
  }, []);

  const calc = async (e: any) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const payload: any = { ...form };
      if (payload.crop === '') delete payload.crop;
      NUMERIC.forEach(k => { if (payload[k] !== undefined && payload[k] !== '') payload[k] = Number(payload[k]); });
      const res = await api.post('/profit/calculate', payload);
      setR(res.data.data);
      const h = await api.get('/profit');
      setHistory(h.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Could not calculate profit.'));
    } finally {
      setLoading(false);
    }
  };

  const costBreakdown = r ? [
    { name: 'Seed', value: Number(r.seedCost) || 0 },
    { name: 'Fertilizer', value: Number(r.fertilizerCost) || 0 },
    { name: 'Pesticide', value: Number(r.pesticideCost) || 0 },
    { name: 'Labour', value: Number(r.labourCost) || 0 },
    { name: 'Irrigation', value: Number(r.irrigationCost) || 0 },
    { name: 'Machinery', value: Number(r.machineryCost) || 0 },
    { name: 'Transport', value: Number(r.transportationCost) || 0 },
    { name: 'Other', value: Number(r.otherCost) || 0 },
  ].filter(x => x.value > 0) : [];

  return (
    <div className="space-y-4">
      <PageHeader title="Profit Calculator" subtitle="Estimate production, revenue and profit for a crop cycle" />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <Card>
        <form onSubmit={calc} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Crop (optional)"><input className={inputCls} placeholder="e.g. Rice" value={form.crop} onChange={set('crop')} /></Field>
          <Field label="Farm Area"><input required type="number" className={inputCls} value={form.farmArea} onChange={set('farmArea')} /></Field>
          <Field label="Unit">
            <select className={inputCls} value={form.unit} onChange={set('unit')}>
              <option value="acres">acres</option>
              <option value="hectares">hectares</option>
            </select>
          </Field>
          <Field label="Expected Yield (q/unit)"><input required type="number" className={inputCls} value={form.expectedYield} onChange={set('expectedYield')} /></Field>
          <Field label="Selling Price (₹/q)"><input required type="number" className={inputCls} value={form.sellingPrice} onChange={set('sellingPrice')} /></Field>
          <Field label="Seed Cost ₹"><input type="number" className={inputCls} value={form.seedCost} onChange={set('seedCost')} /></Field>
          <Field label="Fertilizer Cost ₹"><input type="number" className={inputCls} value={form.fertilizerCost} onChange={set('fertilizerCost')} /></Field>
          <Field label="Pesticide Cost ₹"><input type="number" className={inputCls} value={form.pesticideCost} onChange={set('pesticideCost')} /></Field>
          <Field label="Labour Cost ₹"><input type="number" className={inputCls} value={form.labourCost} onChange={set('labourCost')} /></Field>
          <Field label="Irrigation Cost ₹"><input type="number" className={inputCls} value={form.irrigationCost} onChange={set('irrigationCost')} /></Field>
          <Field label="Machinery Cost ₹"><input type="number" className={inputCls} value={form.machineryCost} onChange={set('machineryCost')} /></Field>
          <Field label="Transportation Cost ₹"><input type="number" className={inputCls} value={form.transportationCost} onChange={set('transportationCost')} /></Field>
          <Field label="Other Cost ₹"><input type="number" className={inputCls} value={form.otherCost} onChange={set('otherCost')} /></Field>
          <div className="col-span-2 md:col-span-4">
            <button className={btnPrimary} disabled={loading}>{loading ? 'Calculating…' : 'Calculate & Save'}</button>
          </div>
        </form>
      </Card>
      {loading && <Spinner />}
      {r && !loading && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-bold text-lg">Results {r.crop ? `— ${r.crop}` : ''}</h2>
            <DataLabel type="calculated" source="Computed from costs, yield and price" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><div className="text-sm text-gray-500">Total Production</div><b>{Number(r.expectedProduction).toLocaleString('en-IN')} q</b></Card>
            <Card><div className="text-sm text-gray-500">Expected Revenue</div><b>{inr(r.expectedRevenue)}</b></Card>
            <Card><div className="text-sm text-gray-500">Total Cost</div><b>{inr(r.totalInvestment)}</b></Card>
            <Card><div className="text-sm text-gray-500">Estimated Profit</div><b className={r.estimatedProfit >= 0 ? 'text-green-700' : 'text-red-600'}>{inr(r.estimatedProfit)}</b></Card>
            <Card><div className="text-sm text-gray-500">Profit / Acre</div><b>{inr(r.profitPerAcre)}</b></Card>
            <Card><div className="text-sm text-gray-500">ROI</div><b>{Number(r.roi).toFixed(1)}%</b></Card>
            <Card><div className="text-sm text-gray-500">Break-even Price</div><b>₹{Number(r.breakEvenPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}/q</b></Card>
            <Card><div className="text-sm text-gray-500">Profit Margin</div><b>{Number(r.profitMargin).toFixed(1)}%</b></Card>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="h-72">
              <h3 className="font-bold mb-2">Cost Breakdown</h3>
              {costBreakdown.length === 0 ? <Empty text="No costs entered." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                      {costBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => inr(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="h-72">
              <h3 className="font-bold mb-2">Cost vs Revenue vs Profit</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Cost', v: Math.round(r.totalInvestment) },
                  { name: 'Revenue', v: Math.round(r.expectedRevenue) },
                  { name: 'Profit', v: Math.round(r.estimatedProfit) },
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => inr(v)} />
                  <Bar dataKey="v" fill="#15803d" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
      <Card>
        <h2 className="font-bold mb-2">Calculation History</h2>
        {initial ? <Spinner /> : history.length === 0 ? <Empty text="No saved calculations yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th>Date</th><th>Crop</th><th>Area</th><th>Investment</th><th>Revenue</th><th>Profit</th></tr></thead>
              <tbody>{history.map(h => (
                <tr key={h._id} className="border-t">
                  <td>{fmtDateTime(h.createdAt)}</td>
                  <td>{h.crop || '—'}</td>
                  <td>{h.farmArea} {h.unit || 'acres'}</td>
                  <td>{inr(h.totalInvestment)}</td>
                  <td>{inr(h.expectedRevenue)}</td>
                  <td className={h.estimatedProfit >= 0 ? 'text-green-700' : 'text-red-600'}>{inr(h.estimatedProfit)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
