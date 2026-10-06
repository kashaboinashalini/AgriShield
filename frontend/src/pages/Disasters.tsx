import { useEffect, useState } from 'react';
import { api, errMsg } from '../services/api';
import { Card, Badge, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, btnGhost } from '../components/ui';

export default function Disasters() {
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/farms');
        const body = r.data.data;
        setFarms(body.data || []);
        if (body.activeFarmId) {
          setFarmId(body.activeFarmId);
          const d = await api.get(`/disasters?farm=${body.activeFarmId}`);
          setData(d.data.data);
        }
      } catch (e: any) {
        setErr(errMsg(e, 'Could not load disaster alerts.'));
      } finally {
        setInitial(false);
      }
    })();
  }, []);

  const load = async () => {
    if (!farmId) return;
    setLoading(true); setErr('');
    try {
      const r = await api.get(`/disasters?farm=${farmId}`);
      setData(r.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Could not load disaster alerts.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const alerts = data && !data.unavailable ? (data.alerts || []) : [];
  const lastUpdated = data?.lastUpdated
    ? (typeof data.lastUpdated === 'string' && !isNaN(Date.parse(data.lastUpdated)) ? new Date(data.lastUpdated).toLocaleString('en-IN') : data.lastUpdated)
    : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Disaster Alerts"
        subtitle="Weather-based disaster warnings for your farm location"
        actions={<button onClick={load} disabled={loading || !farmId} className={btnPrimary}>⟳ Refresh</button>}
      />
      <Card>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="block flex-1 min-w-[200px]">
            <span className="text-xs font-semibold text-gray-600">Farm</span>
            <select className={inputCls} value={farmId} onChange={e => setFarmId(e.target.value)}>
              <option value="">— Select farm —</option>
              {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
            </select>
          </label>
        </div>
      </Card>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {loading ? <Spinner /> : initial ? <Spinner /> : !data ? (
        <Empty text="Select a farm to check disaster alerts." />
      ) : data.unavailable ? (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <DataLabel type="unavailable" />
            <p className="text-sm text-gray-600">{data.message || 'Disaster alert data is temporarily unavailable.'}</p>
            <button onClick={load} disabled={loading} className={btnGhost}>Retry</button>
          </div>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <DataLabel type="live" source={data.source ? `Weather API — ${data.source}` : 'Weather API'} />
            <p className="text-sm">✅ No active disaster alerts for your location.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <DataLabel type="live" source={`Weather API — ${data.source || 'weather service'}`} />
            {data.location && <span className="text-sm font-semibold">📍 {data.location}</span>}
            {lastUpdated && <span className="text-xs text-gray-400">Last updated: {lastUpdated}</span>}
          </div>
          {alerts.map((a: any, i: number) => (
            <Card key={a._id || i}>
              <h2 className="font-bold text-lg">🔴 {a.type} <Badge level={a.severity}>{a.severity}</Badge></h2>
              <p className="text-gray-600 mt-1">{a.message}</p>
              {a.actions?.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Recommended actions:</p>
                  <ol className="list-decimal list-inside text-sm">{a.actions.map((x: string, j: number) => <li key={j}>{x}</li>)}</ol>
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
