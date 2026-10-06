import { useEffect, useState } from 'react';
import { api, errMsg } from '../services/api';
import { Card, Badge, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, Field } from '../components/ui';

const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Alluvial Soil', 'Loamy Soil', 'Sandy Soil', 'Clay Soil', 'Other'];
const SEASONS = ['Kharif', 'Rabi', 'Zaid'];
const WATER = ['High', 'Moderate', 'Low'];
const NUMERIC = ['ph', 'nitrogen', 'phosphorus', 'potassium', 'temperature', 'rainfall', 'area'];

export default function Recommend() {
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ farm: '', soilType: 'Black Soil', ph: 6.8, nitrogen: 40, phosphorus: 28, potassium: 32, temperature: 29, rainfall: 90, waterAvailability: 'Moderate', season: 'Kharif', area: 3, state: '', district: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
  }, []);

  const run = async (e: any) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.farm) delete payload.farm;
      if (payload.state === '') delete payload.state;
      if (payload.district === '') delete payload.district;
      NUMERIC.forEach(k => { if (payload[k] !== undefined && payload[k] !== '') payload[k] = Number(payload[k]); });
      const r = await api.post('/crops/recommend', payload);
      setResult(r.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Could not recommend crops.'));
    } finally {
      setLoading(false);
    }
  };

  const recs = result?.recommendations || [];

  return (
    <div className="space-y-4">
      <PageHeader title="Crop Recommendation Engine" subtitle="Get ranked crop suggestions based on soil, climate and water conditions" />
      <Card>
        <form onSubmit={run} className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <Field label="pH (0–14)"><input required type="number" min={0} max={14} step="0.1" className={inputCls} value={form.ph} onChange={set('ph')} /></Field>
          <Field label="Nitrogen (kg/ha)"><input type="number" className={inputCls} value={form.nitrogen} onChange={set('nitrogen')} /></Field>
          <Field label="Phosphorus (kg/ha)"><input type="number" className={inputCls} value={form.phosphorus} onChange={set('phosphorus')} /></Field>
          <Field label="Potassium (kg/ha)"><input type="number" className={inputCls} value={form.potassium} onChange={set('potassium')} /></Field>
          <Field label="Temperature °C"><input type="number" className={inputCls} value={form.temperature} onChange={set('temperature')} /></Field>
          <Field label="Expected Rainfall (mm)"><input type="number" className={inputCls} value={form.rainfall} onChange={set('rainfall')} /></Field>
          <Field label="Water Availability">
            <select className={inputCls} value={form.waterAvailability} onChange={set('waterAvailability')}>
              {WATER.map(w => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Season">
            <select className={inputCls} value={form.season} onChange={set('season')}>
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Area (acres)"><input type="number" className={inputCls} value={form.area} onChange={set('area')} /></Field>
          <Field label="State (optional)"><input className={inputCls} placeholder="e.g. Telangana" value={form.state} onChange={set('state')} /></Field>
          <Field label="District (optional)"><input className={inputCls} placeholder="e.g. Hyderabad" value={form.district} onChange={set('district')} /></Field>
          <div className="col-span-2 md:col-span-4">
            <button className={btnPrimary} disabled={loading}>{loading ? 'Analyzing…' : 'Get Recommendations'}</button>
            {err && <span className="text-red-600 ml-3 text-sm">{err}</span>}
          </div>
        </form>
      </Card>
      {loading && <Spinner />}
      {!loading && result && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-bold text-lg">Recommended Crops ({recs.length})</h2>
            <DataLabel type="calculated" source={result.source || 'Computed from soil & climate inputs'} />
          </div>
          {recs.length === 0 ? <Empty text="No crop recommendations available for these conditions." /> : (
            <div className="grid md:grid-cols-3 gap-3">
              {recs.map((c: any, i: number) => (
                <Card key={c.name}>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold">{i + 1}. {c.name}</h3>
                    <Badge level={c.riskLevel === 'Low' ? 'LOW' : c.riskLevel === 'High' ? 'HIGH' : 'MEDIUM'}>{c.riskLevel} risk</Badge>
                  </div>
                  <div className="mt-2 text-sm text-green-700 font-bold text-xl">{c.suitability}% suitability</div>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>Expected yield: <b>{c.expectedYield}</b></li>
                    <li>Water requirement: <b>{c.waterRequirement}</b></li>
                    <li>Growth duration: <b>{c.growthDuration}</b></li>
                  </ul>
                  {c.reasons?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-gray-500">Why this crop:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600">{c.reasons.map((r: string, j: number) => <li key={j}>{r}</li>)}</ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      {!loading && !result && <Empty text="Enter your soil and climate details, then press “Get Recommendations”." />}
    </div>
  );
}
