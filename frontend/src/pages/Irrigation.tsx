import { useEffect, useState } from 'react';
import { api, errMsg } from '../services/api';
import { Card, Badge, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, Field, fmtDateTime } from '../components/ui';

const STAGES = ['seedling', 'vegetative', 'flowering', 'fruiting'];
const WATER = ['High', 'Moderate', 'Low'];
const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Alluvial Soil', 'Loamy Soil', 'Sandy Soil', 'Clay Soil', 'Other'];
const NUMERIC = ['soilMoisture', 'temperature', 'rainProbability', 'lastIrrigationHours', 'farmArea'];

export default function Irrigation() {
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ farm: '', crop: 'Rice', growthStage: 'flowering', soilMoisture: 18, temperature: 34, rainProbability: 12, lastIrrigationHours: 52, waterAvailability: 'Moderate', soilType: 'Black Soil', farmArea: 3 });
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
    api.get('/irrigation')
      .then(r => setHistory(r.data.data))
      .catch((e: any) => setErr(errMsg(e, 'Could not load irrigation history.')))
      .finally(() => setInitial(false));
  }, []);

  const run = async (e: any) => {
    e.preventDefault();
    setErr(''); setResult(null); setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.farm) delete payload.farm;
      if (payload.waterAvailability === '') delete payload.waterAvailability;
      if (payload.soilType === '') delete payload.soilType;
      NUMERIC.forEach(k => { if (payload[k] !== undefined && payload[k] !== '') payload[k] = Number(payload[k]); });
      const r = await api.post('/irrigation/analyze', payload);
      setResult(r.data.data);
      const h = await api.get('/irrigation');
      setHistory(h.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Could not generate irrigation advice.'));
    } finally {
      setLoading(false);
    }
  };

  const nextCheck = result?.nextCheck
    ? (typeof result.nextCheck === 'string' && !isNaN(Date.parse(result.nextCheck)) ? fmtDateTime(result.nextCheck) : result.nextCheck)
    : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Smart Irrigation" subtitle="AI irrigation advice enriched with live weather when a farm is selected" />
      <Card>
        <form onSubmit={run} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Farm (optional — adds live weather)">
            <select className={inputCls} value={form.farm} onChange={set('farm')}>
              <option value="">— Manual inputs —</option>
              {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
            </select>
          </Field>
          <Field label="Crop"><input required className={inputCls} value={form.crop} onChange={set('crop')} /></Field>
          <Field label="Growth Stage">
            <select className={inputCls} value={form.growthStage} onChange={set('growthStage')}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Soil Moisture %"><input required type="number" className={inputCls} value={form.soilMoisture} onChange={set('soilMoisture')} /></Field>
          <Field label="Temperature °C"><input type="number" className={inputCls} value={form.temperature} onChange={set('temperature')} /></Field>
          <Field label="Rain Probability %"><input type="number" className={inputCls} value={form.rainProbability} onChange={set('rainProbability')} /></Field>
          <Field label="Last Irrigation (hours ago)"><input type="number" className={inputCls} value={form.lastIrrigationHours} onChange={set('lastIrrigationHours')} /></Field>
          <Field label="Water Availability">
            <select className={inputCls} value={form.waterAvailability} onChange={set('waterAvailability')}>
              {WATER.map(w => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Soil Type">
            <select className={inputCls} value={form.soilType} onChange={set('soilType')}>
              {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Farm Area (acres)"><input type="number" className={inputCls} value={form.farmArea} onChange={set('farmArea')} /></Field>
          <div className="col-span-2 md:col-span-4">
            <button className={btnPrimary} disabled={loading}>{loading ? 'Analyzing…' : 'Get Irrigation Advice'}</button>
            {err && <span className="text-red-600 ml-3 text-sm">{err}</span>}
          </div>
        </form>
      </Card>
      {loading && <Spinner />}
      {result && !loading && (
        <Card>
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <h2 className="text-xl font-bold"><Badge level={result.decision}>{result.decision.replace(/_/g, ' ')}</Badge></h2>
            <DataLabel type={result.weatherAvailable ? 'live' : 'calculated'} source={result.weatherSource || (result.weatherAvailable ? 'Live weather service' : 'Computed from inputs')} />
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <p>Irrigation status for <b>{result.crop}</b> ({result.growthStage} stage).</p>
            {result.waterLitres != null && (
              <p>Recommended water: <b className="text-green-700 text-lg">{Number(result.waterLitres).toLocaleString('en-IN')} L</b></p>
            )}
            <p><b>Reason:</b> {result.reason}</p>
            {result.factors?.length > 0 && (
              <div>
                <b>Factors:</b>
                <ul className="list-disc list-inside text-gray-600">{result.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>
              </div>
            )}
            {nextCheck && <p><b>Next check:</b> {nextCheck}</p>}
          </div>
        </Card>
      )}
      <Card>
        <h2 className="font-bold mb-2">Irrigation History</h2>
        {initial ? <Spinner /> : history.length === 0 ? <Empty text="No irrigation records yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th>Date</th><th>Crop</th><th>Stage</th><th>Soil Moisture</th><th>Temp °C</th><th>Rain %</th><th>Last Irrigated (h)</th></tr></thead>
              <tbody>{history.map(h => (
                <tr key={h._id} className="border-t">
                  <td>{fmtDateTime(h.createdAt)}</td>
                  <td>{h.crop}</td>
                  <td>{h.growthStage}</td>
                  <td>{h.soilMoisture}%</td>
                  <td>{h.temperature}</td>
                  <td>{h.rainProbability}%</td>
                  <td>{h.lastIrrigationHours}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
