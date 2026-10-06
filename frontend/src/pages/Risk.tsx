import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, AlertTriangle, CloudSun, Bug, Droplets, Sprout, ShieldAlert as Overall, History } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Badge, Spinner, Empty, PageHeader, DataLabel, inputCls, btnPrimary, timeAgo, fmtDateTime } from '../components/ui';

const RISK_META: Record<string, { label: string; icon: any; key: string }> = {
  weatherRisk: { label: 'Weather Risk', icon: CloudSun, key: 'weather' },
  diseaseRisk: { label: 'Disease Risk', icon: Bug, key: 'disease' },
  pestRisk: { label: 'Pest Risk', icon: Activity, key: 'pest' },
  waterRisk: { label: 'Water Risk', icon: Droplets, key: 'water' },
  soilRisk: { label: 'Soil Risk', icon: Sprout, key: 'soil' },
};

export default function Risk() {
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/farms').then(r => {
      const list = r.data.data || [];
      setFarms(list);
      const active = list.find((f: any) => f.active);
      if (active) setFarmId(active._id);
      else if (list[0]) setFarmId(list[0]._id);
    }).catch(() => {});
  }, []);

  const analyze = useCallback(async (id = farmId) => {
    if (!id) return;
    setLoading(true);
    setErr('');
    try {
      const [r, h, d] = await Promise.all([
        api.post('/risk/analyze', { farmId: id }),
        api.get('/risk/history'),
        api.get(`/disasters?farm=${id}`),
      ]);
      setResult(r.data.data);
      setHistory(h.data.data || []);
      setDisasters(d.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Risk analysis failed.'));
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => { if (farmId) analyze(farmId); }, [farmId]); // eslint-disable-line

  return (
    <div className="space-y-4">
      <PageHeader
        title="Risk & Alerts"
        subtitle="Farm risk engine — weather, disease, pest, water and soil risk"
        actions={
          <div className="flex gap-2">
            {farms.length > 0 && (
              <select value={farmId} onChange={e => setFarmId(e.target.value)} className={inputCls + ' w-auto'}>
                {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
              </select>
            )}
            <button onClick={() => analyze()} disabled={loading} className={btnPrimary + ' flex items-center gap-1.5'}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {loading ? 'Analyzing…' : 'Run Analysis'}
            </button>
          </div>
        }
      />
      {err && <Card className="text-red-600 text-sm">{err}</Card>}
      {farms.length === 0 && <Card><Empty text="Add a farm first — risk analysis runs per farm." /></Card>}

      {loading && !result ? <Spinner /> : result && (
        <>
          {/* Overall */}
          <Card className={result.overallRisk === 'HIGH' || result.overallRisk === 'CRITICAL' ? 'border-red-200 bg-red-50/40' : ''}>
            <div className="flex flex-wrap items-center gap-3">
              <Overall size={22} className="text-green-700" />
              <div className="mr-auto">
                <div className="text-xs text-gray-400">OVERALL FARM RISK</div>
                <div className="text-2xl font-extrabold">{result.overallRisk}</div>
              </div>
              <Badge level={result.overallRisk} />
              <DataLabel type="calculated" source={result.source} />
              <span className="text-xs text-gray-400">{timeAgo(result.createdAt)}</span>
            </div>
            {!result.weatherAvailable && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                <AlertTriangle size={14} /> Live weather unavailable — weather risk estimated from farm records.
              </div>
            )}
          </Card>

          {/* 5 risk dimensions */}
          <div className="grid md:grid-cols-5 gap-3">
            {(Object.keys(RISK_META) as (keyof typeof RISK_META)[]).map((k) => {
              const meta = RISK_META[k];
              const Icon = meta.icon;
              const value = result[k];
              return (
                <Card key={k}>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5"><Icon size={14} /> {meta.label}</div>
                  <Badge level={value} />
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{result.reasons?.[meta.key]}</p>
                </Card>
              );
            })}
          </div>

          {/* Inputs used */}
          {result.inputs && (
            <Card>
              <div className="text-xs font-bold text-gray-500 mb-2">INPUTS ANALYZED {result.weatherAvailable ? <DataLabel type="live" source="Weather API" /> : <DataLabel type="database" source="Farm records" />}</div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                {result.inputs.temperature != null && <span>🌡️ Temperature: <b>{result.inputs.temperature}°C</b></span>}
                {result.inputs.rainProbability != null && <span>🌧️ Rain probability: <b>{result.inputs.rainProbability}%</b></span>}
                {result.inputs.humidity != null && <span>💧 Humidity: <b>{result.inputs.humidity}%</b></span>}
                {result.inputs.windSpeed != null && <span>💨 Wind: <b>{result.inputs.windSpeed} km/h</b></span>}
                {result.inputs.soilMoisture != null && <span>🪱 Soil moisture: <b>{result.inputs.soilMoisture}%</b></span>}
                {result.inputs.crop && <span>🌾 Crop: <b>{result.inputs.crop}</b></span>}
                {result.inputs.growthStage && <span>📈 Stage: <b>{result.inputs.growthStage}</b></span>}
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <div className="text-xs font-bold text-gray-500 mb-2">RECOMMENDED ACTIONS</div>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {(result.actions || []).map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ul>
          </Card>
        </>
      )}

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Disaster alerts */}
        <Card>
          <h3 className="font-bold mb-2 flex items-center gap-1.5 text-sm"><AlertTriangle size={15} /> Disaster Alerts</h3>
          {disasters?.unavailable ? (
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-700">Live weather data is temporarily unavailable.</p>
                <p className="text-xs text-gray-500 mt-0.5">{disasters.message}</p>
                <DataLabel type="unavailable" />
              </div>
            </div>
          ) : disasters?.alerts?.length ? (
            <ul className="space-y-2">
              {disasters.alerts.map((a: any, i: number) => (
                <li key={i} className="border border-red-100 bg-red-50/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-red-700">⚠ {a.type}</span>
                    <Badge level={a.severity} />
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{a.message}</p>
                  <div className="text-xs font-bold text-gray-500 mt-2 mb-1">RECOMMENDED</div>
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                    {a.actions.map((x: string, j: number) => <li key={j}>{x}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No active disaster alerts for your location." />
          )}
          {disasters && !disasters.unavailable && (
            <div className="mt-2 flex items-center gap-2">
              <DataLabel type="live" source={disasters.source} />
              <span className="text-[11px] text-gray-400">{disasters.location} · updated {disasters.lastUpdated ? timeAgo(disasters.lastUpdated) : '—'}</span>
            </div>
          )}
        </Card>

        {/* Risk history */}
        <Card>
          <h3 className="font-bold mb-2 flex items-center gap-1.5 text-sm"><History size={15} /> Assessment History</h3>
          {history.length === 0 ? <Empty text="No past assessments yet." /> : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {history.slice(0, 20).map((h: any) => (
                <li key={h._id} className="border border-gray-100 rounded-xl p-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-400">{fmtDateTime(h.createdAt)} ({timeAgo(h.createdAt)})</div>
                    <div className="text-[11px] text-gray-500 truncate">
                      W:{h.weatherRisk} D:{h.diseaseRisk} P:{h.pestRisk} Wa:{h.waterRisk} S:{h.soilRisk}
                    </div>
                  </div>
                  <Badge level={h.overallRisk} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
