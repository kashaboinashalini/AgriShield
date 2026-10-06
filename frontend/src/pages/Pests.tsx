import { useEffect, useState } from 'react';
import { uploadImage, api, errMsg } from '../services/api';
import { Card, Badge, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, fmtDateTime } from '../components/ui';

export default function Pests() {
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [err, setErr] = useState('');

  const loadHist = async () => {
    try {
      const r = await api.get('/scans/pest');
      setHistory(r.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Could not load pest scan history.'));
    } finally {
      setInitial(false);
    }
  };

  useEffect(() => {
    loadHist();
    api.get('/farms')
      .then(r => {
        const body = r.data.data;
        setFarms(body.data || []);
        if (body.activeFarmId) setFarmId(body.activeFarmId);
      })
      .catch(() => {});
  }, []);

  const onFile = (e: any) => {
    const f = e.target.files?.[0];
    if (f && !/^image\/(jpe?g|png)$/.test(f.type)) { setErr('Please upload a valid JPG or PNG image.'); return; }
    setErr('');
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : '');
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return setErr('Please choose an image first.');
    setLoading(true); setErr('');
    try {
      const r = await uploadImage('/scans/pest', file, farmId ? { farm: farmId } : {});
      setResult(r.data.data);
      loadHist();
    } catch (e: any) {
      setErr(errMsg(e, 'Unable to process this image. Please upload a valid JPG or PNG image.'));
    } finally {
      setLoading(false);
    }
  };

  const dmg = (l: string) => (l === 'High' || l === 'Severe' ? 'HIGH' : l === 'Moderate' || l === 'Medium' ? 'MEDIUM' : 'LOW');

  return (
    <div className="space-y-4">
      <PageHeader title="Pest Detection" subtitle="Upload a photo of affected crop for AI pest identification" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Farm (optional)</span>
              <select className={inputCls} value={farmId} onChange={e => setFarmId(e.target.value)}>
                <option value="">— Select farm —</option>
                {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
              </select>
            </label>
            <input type="file" accept="image/jpeg,image/png" onChange={onFile} className="text-sm" />
            {preview && <img src={preview} alt="preview" className="rounded-xl w-full object-cover max-h-64" />}
            <button onClick={analyze} disabled={loading} className={btnPrimary}>{loading ? 'Analyzing…' : 'Detect Pest'}</button>
            {err && <p className="text-red-600 text-sm">{err}</p>}
          </div>
        </Card>
        <Card>
          {!result ? <Empty text="Upload an image of affected crop to detect pests. Results are saved to history." /> : (
            <div className="space-y-2">
              <div className="flex flex-wrap justify-between gap-2 items-center">
                <h2 className="font-bold text-lg">{result.pest}</h2>
                <DataLabel type={result.demo ? 'demo' : 'ai'} source="Python AI Service" />
              </div>
              <p>Crop: <b>{result.crop}</b> · Confidence: <b>{result.confidence}%</b></p>
              <p>Damage level: <Badge level={dmg(result.damageLevel)}>{result.damageLevel}</Badge></p>
              <p><b>Suggested action:</b> {result.action}</p>
              {result.prevention?.length > 0 && <div><b>Prevention:</b><ul className="list-disc list-inside text-sm">{result.prevention.map((s: string) => <li key={s}>{s}</li>)}</ul></div>}
            </div>
          )}
        </Card>
      </div>
      <Card>
        <h2 className="font-bold mb-2">Pest Scan History</h2>
        {initial ? <Spinner /> : history.length === 0 ? <Empty text="No pest scans yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th>Date</th><th>Crop</th><th>Pest</th><th>Confidence</th><th>Severity</th><th>Action</th></tr></thead>
              <tbody>{history.map(h => (
                <tr key={h._id} className="border-t">
                  <td>{fmtDateTime(h.createdAt)}</td>
                  <td>{h.crop}</td>
                  <td>{h.pest}</td>
                  <td>{h.confidence}%</td>
                  <td><Badge level={dmg(h.damageLevel)}>{h.damageLevel}</Badge></td>
                  <td className="max-w-xs">{h.action}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
