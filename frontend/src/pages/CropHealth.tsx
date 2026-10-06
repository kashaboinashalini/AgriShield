import { useCallback, useEffect, useState } from 'react';
import { ScanLine, Filter } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Badge, Spinner, Empty, PageHeader, DataLabel, inputCls, timeAgo, fmtDateTime } from '../components/ui';

export default function CropHealth() {
  const [scans, setScans] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmFilter, setFarmFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr('');
    try {
      const [s, f] = await Promise.all([api.get('/scans/crop'), api.get('/farms')]);
      setScans(s.data.data || []);
      setFarms(f.data.data || []);
      if ((s.data.data || []).length) setSelected(s.data.data[0]);
    } catch (e: any) {
      setErr(errMsg(e, 'Failed to load crop health history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = farmFilter ? scans.filter((s: any) => String(s.farm) === farmFilter) : scans;
  const healthy = scans.filter((s: any) => s.risk === 'LOW').length;
  const moderate = scans.filter((s: any) => s.risk === 'MEDIUM').length;
  const high = scans.filter((s: any) => s.risk === 'HIGH').length;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Crop Health"
        subtitle="History of AI crop disease scans"
        actions={
          farms.length > 0 ? (
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select value={farmFilter} onChange={e => setFarmFilter(e.target.value)} className={inputCls + ' w-auto'}>
                <option value="">All farms</option>
                {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
              </select>
            </div>
          ) : undefined
        }
      />
      {err && <Card className="text-red-600 text-sm">{err}</Card>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><div className="text-sm text-gray-500">Total Scans</div><div className="text-2xl font-bold">{scans.length}</div></Card>
        <Card><div className="text-sm text-gray-500">Healthy</div><div className="text-2xl font-bold text-green-600">{healthy}</div></Card>
        <Card><div className="text-sm text-gray-500">Moderate Risk</div><div className="text-2xl font-bold text-amber-600">{moderate}</div></Card>
        <Card><div className="text-sm text-gray-500">High Risk</div><div className="text-2xl font-bold text-red-600">{high}</div></Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-3">
        {/* Scan list */}
        <Card className="lg:col-span-2">
          <h3 className="font-bold mb-2 flex items-center gap-1.5 text-sm"><ScanLine size={15} /> Scan History</h3>
          {filtered.length === 0 ? (
            <Empty text="No crop scans yet. Upload a crop image in Disease Detection to begin." />
          ) : (
            <ul className="space-y-2 max-h-[480px] overflow-y-auto">
              {filtered.map((s: any) => (
                <li key={s._id}>
                  <button
                    onClick={() => setSelected(s)}
                    className={`w-full text-left border rounded-xl p-3 transition-colors ${selected?._id === s._id ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-green-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{s.crop} — {s.disease}</span>
                      <Badge level={s.risk} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span>{fmtDateTime(s.createdAt)} ({timeAgo(s.createdAt)})</span>
                      <span>{s.confidence}% confidence</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Detail */}
        <Card className="lg:col-span-3">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="font-bold mr-auto">{selected.crop} — {selected.disease}</h3>
                <DataLabel type={selected.demo ? 'demo' : 'ai'} source="Python AI Service" />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-gray-400">Confidence</div>
                  <div className="text-xl font-bold">{selected.confidence}%</div>
                </div>
                <div className="border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-gray-400">Severity</div>
                  <div className="text-xl font-bold">{selected.severity}</div>
                </div>
                <div className="border border-gray-100 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-gray-400">Risk</div>
                  <div className="mt-1"><Badge level={selected.risk} /></div>
                </div>
              </div>
              {selected.symptoms?.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-gray-500 mb-1">SYMPTOMS OBSERVED</div>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">{selected.symptoms.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {selected.recommendations?.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-gray-500 mb-1">RECOMMENDED ACTION</div>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">{selected.recommendations.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {selected.prevention?.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">PREVENTION</div>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">{selected.prevention.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-4">
                Note: this is a local image-analysis pipeline, not a medical/agricultural-grade diagnosis.
                Confirm serious findings with a local agricultural extension officer.
              </p>
            </>
          ) : (
            <Empty text="Select a scan to view details." />
          )}
        </Card>
      </div>
    </div>
  );
}
