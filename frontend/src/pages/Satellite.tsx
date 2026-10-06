import { useEffect, useState } from 'react';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary } from '../components/ui';

export default function Satellite() {
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [data, setData] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/farms')
      .then(r => {
        const body = r.data.data;
        setFarms(body.data || []);
        if (body.activeFarmId) setFarmId(body.activeFarmId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!farmId) return;
    let on = true;
    setLoading(true); setErr('');
    api.get(`/satellite/${farmId}`)
      .then(r => { if (on) setData(r.data.data); })
      .catch((e: any) => { if (on) setErr(errMsg(e, 'Could not load satellite analysis.')); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [farmId, refresh]);

  const color = (v: number) => (v > 0.7 ? 'bg-green-600' : v > 0.55 ? 'bg-lime-500' : v > 0.4 ? 'bg-yellow-400' : 'bg-red-400');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Satellite Crop Monitoring"
        subtitle="NDVI-style vegetation health heatmap per farm"
        actions={
          <select className={inputCls + ' w-auto'} value={farmId} onChange={e => setFarmId(e.target.value)}>
            {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
          </select>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setRefresh(n => n + 1)} disabled={!farmId || loading} className={btnPrimary}>
            {loading ? 'Generating…' : 'Generate Crop Health Data'}
          </button>
        </div>
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <DataLabel type="demo" />
            <span className="text-xs font-bold tracking-wide text-gray-500">SIMULATED DATA</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {data?.label || 'Satellite Analysis — Demo Mode. This imagery is simulated for demonstration purposes and does not represent real satellite data.'}
          </p>
        </div>
      </Card>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {loading ? <Spinner /> : !data ? <Empty text="Select a farm to generate satellite crop health data." /> : (
        <Card>
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <h2 className="font-bold">{data.farm || 'Farm'} — Health Score: <b>{data.healthScore}/100</b> ({data.healthBand})</h2>
            {data.source && <span className="text-xs text-gray-400">Source: {data.source} · {data.dataType}</span>}
          </div>
          <p className="text-sm text-gray-600 mt-2">{data.interpretation}</p>
          <h3 className="font-semibold text-sm mt-4 mb-2">NDVI Vegetation Grid (8×8)</h3>
          <div className="grid grid-cols-8 gap-1 w-full max-w-md">
            {(data.grid || []).flat().map((v: number, i: number) => (
              <div key={i} className={`aspect-square rounded ${color(v)}`} title={`NDVI ${v}`} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Green = healthy vegetation · yellow = moderate · red = stressed zone</p>
          {data.stressedZones?.length > 0 && (
            <div className="mt-3">
              <b className="text-sm">Stressed zones:</b>
              <div className="flex flex-wrap gap-2 mt-1">
                {data.stressedZones.map((z: any, i: number) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-semibold">
                    R{z.row} C{z.col} · NDVI {z.ndvi}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
