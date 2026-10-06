import { useEffect, useState } from 'react';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, Field, fmtDateTime } from '../components/ui';

const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Alluvial Soil', 'Loamy Soil', 'Sandy Soil', 'Clay Soil', 'Other'];
const NUMERIC = ['ph', 'nitrogen', 'phosphorus', 'potassium', 'moisture', 'temperature'];

export default function Soil() {
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ farm: '', soilType: 'Black Soil', ph: 6.5, nitrogen: 40, phosphorus: 28, potassium: 32, organicCarbon: '', moisture: 45, temperature: 29, location: '' });
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [err, setErr] = useState('');
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.get('/farms')
      .then(r => {
        const body = r.data.data;
        setFarms(body.data || []);
        if (body.activeFarmId) setForm((f: any) => ({ ...f, farm: body.activeFarmId }));
      })
      .catch(() => {});
    api.get('/soil')
      .then(r => setHistory(r.data.data))
      .catch((e: any) => setErr(errMsg(e, 'Could not load soil analysis history.')))
      .finally(() => setInitial(false));
  }, []);

  const analyze = async (e: any) => {
    e.preventDefault();
    setErr(''); setResult(null); setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.farm) delete payload.farm;
      if (payload.organicCarbon === '') delete payload.organicCarbon;
      if (payload.location === '') delete payload.location;
      NUMERIC.forEach(k => { if (payload[k] !== undefined && payload[k] !== '') payload[k] = Number(payload[k]); });
      const r = await api.post('/soil/analyze', payload);
      setResult(r.data.data);
      const h = await api.get('/soil');
      setHistory(h.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Soil analysis failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Soil Health Analyzer" subtitle="Analyze soil nutrients and get a computed health score" />
      <Card>
        <form onSubmit={analyze} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Farm (optional)">
            <select className={inputCls} value={form.farm} onChange={set('farm')}>
              <option value="">— Select farm —</option>
              {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
            </select>
          </Field>
          <Field label="Soil Type">
            <select className={inputCls} value={form.soilType} onChange={set('soilType')}>
              {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="pH (0–14)" hint="0 to 14">
            <input required type="number" min={0} max={14} step="0.1" className={inputCls} value={form.ph} onChange={set('ph')} />
          </Field>
          <Field label="Nitrogen (kg/ha)"><input type="number" className={inputCls} value={form.nitrogen} onChange={set('nitrogen')} /></Field>
          <Field label="Phosphorus (kg/ha)"><input type="number" className={inputCls} value={form.phosphorus} onChange={set('phosphorus')} /></Field>
          <Field label="Potassium (kg/ha)"><input type="number" className={inputCls} value={form.potassium} onChange={set('potassium')} /></Field>
          <Field label="Organic Carbon (optional) %"><input type="number" step="0.1" className={inputCls} placeholder="Optional" value={form.organicCarbon} onChange={set('organicCarbon')} /></Field>
          <Field label="Moisture %"><input type="number" className={inputCls} value={form.moisture} onChange={set('moisture')} /></Field>
          <Field label="Temperature °C"><input type="number" className={inputCls} value={form.temperature} onChange={set('temperature')} /></Field>
          <Field label="Location (optional)"><input className={inputCls} placeholder="e.g. Hyderabad" value={form.location} onChange={set('location')} /></Field>
          <div className="col-span-2 md:col-span-4">
            <button className={btnPrimary} disabled={loading}>{loading ? 'Analyzing…' : 'Analyze Soil'}</button>
            {err && <span className="text-red-600 ml-3 text-sm">{err}</span>}
          </div>
        </form>
      </Card>
      {loading && <Spinner />}
      {result && !loading && (
        <Card>
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <h2 className="font-bold text-xl">Soil Health Score: {result.score}/100</h2>
            <DataLabel type="calculated" source="Computed from soil inputs" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 my-3 text-sm">
            <div>pH: <b>{result.phCondition}</b></div>
            <div>Nitrogen: <b>{result.nitrogenStatus}</b></div>
            <div>Phosphorus: <b>{result.phosphorusStatus}</b></div>
            <div>Potassium: <b>{result.potassiumStatus}</b></div>
            <div>Moisture: <b>{result.moistureStatus}</b></div>
          </div>
          {result.suitableCrops?.length > 0 && <p><b>Suitable crops:</b> {result.suitableCrops.join(', ')}</p>}
          {result.recommendations?.length > 0 && (
            <div className="mt-2">
              <b>Recommendations:</b>
              <ul className="list-disc list-inside text-sm">{result.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
        </Card>
      )}
      <Card>
        <h2 className="font-bold mb-2">Analysis History</h2>
        {initial ? <Spinner /> : history.length === 0 ? <Empty text="No soil analyses yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th>Date</th><th>Soil Type</th><th>pH</th><th>N</th><th>P</th><th>K</th><th>Moisture</th><th>Score</th></tr></thead>
              <tbody>{history.map(h => (
                <tr key={h._id} className="border-t">
                  <td>{fmtDateTime(h.createdAt)}</td>
                  <td>{h.soilType}</td>
                  <td>{h.ph}</td>
                  <td>{h.nitrogen}</td>
                  <td>{h.phosphorus}</td>
                  <td>{h.potassium}</td>
                  <td>{h.moisture}%</td>
                  <td><b>{h.score}/100</b></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
