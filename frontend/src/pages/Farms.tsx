import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, inputCls, btnPrimary, btnGhost, Badge, DataLabel } from '../components/ui';
import { CheckCircle, Star, MapPin } from 'lucide-react';

const empty = {
  farmName: '', owner: '', village: '', district: '', state: '', area: '',
  unit: 'acres', soilType: 'Black Soil', irrigationType: 'Drip',
  waterAvailability: '', currentCrop: '', season: '', sowingDate: '',
  latitude: '', longitude: '',
};

const SOIL_TYPES = ['Black Soil', 'Red Soil', 'Alluvial Soil', 'Loamy Soil', 'Sandy Soil', 'Clay Soil', 'Other'];
const IRRIGATION_TYPES = ['Drip', 'Sprinkler', 'Canal', 'Borewell', 'Rainfed', 'Other'];

export default function Farms() {
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [edit, setEdit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.get('/farms')
    .then(r => setFarms(r.data.data || []))
    .catch(e => setErr(errMsg(e)))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      if (edit) await api.put(`/farms/${edit}`, form);
      else await api.post('/farms', form);
      setForm(empty); setEdit(null);
      setMsg('Farm saved successfully.');
      load();
    } catch (e: any) {
      setErr(errMsg(e, 'Could not save farm.'));
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this farm?')) return;
    try { await api.delete(`/farms/${id}`); load(); }
    catch (e: any) { setErr(errMsg(e, 'Could not delete farm.')); }
  };

  const activate = async (id: string) => {
    try {
      await api.patch(`/farms/${id}/activate`);
      setMsg('Active farm updated.');
      load();
    } catch (e: any) { setErr(errMsg(e, 'Could not set active farm.')); }
  };

  const startEdit = (f: any) => {
    setEdit(f._id);
    setForm({ ...f, sowingDate: f.sowingDate ? String(f.sowingDate).slice(0, 10) : '' });
    window.scrollTo(0, 0);
  };
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <PageHeader title="My Farms" subtitle="Manage your farms — coordinates drive weather, risk and maps" />
      {err && <Card className="text-red-600 text-sm">{err}</Card>}
      {msg && <Card className="text-green-700 text-sm flex items-center gap-2"><CheckCircle size={16} /> {msg}</Card>}

      <Card>
        <h2 className="font-bold mb-3">{edit ? 'Edit Farm' : 'Add Farm'}</h2>
        <form onSubmit={save} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><input required placeholder="Farm name *" className={inputCls} value={form.farmName} onChange={set('farmName')} /></div>
          <div><input placeholder="Owner" className={inputCls} value={form.owner} onChange={set('owner')} /></div>
          <div><input placeholder="Village" className={inputCls} value={form.village} onChange={set('village')} /></div>
          <div><input placeholder="District" className={inputCls} value={form.district} onChange={set('district')} /></div>
          <div><input placeholder="State" className={inputCls} value={form.state} onChange={set('state')} /></div>
          <div>
            <div className="flex gap-2">
              <input required type="number" step="0.1" min="0" placeholder="Area *" className={inputCls} value={form.area} onChange={set('area')} />
            </div>
          </div>
          <select className={inputCls} value={form.unit} onChange={set('unit')}><option value="acres">Acres</option><option value="hectares">Hectares</option></select>
          <select className={inputCls} value={form.soilType} onChange={set('soilType')}>{SOIL_TYPES.map(s => <option key={s}>{s}</option>)}</select>
          <select className={inputCls} value={form.irrigationType} onChange={set('irrigationType')}>{IRRIGATION_TYPES.map(s => <option key={s}>{s}</option>)}</select>
          <input placeholder="Water availability" className={inputCls} value={form.waterAvailability} onChange={set('waterAvailability')} />
          <input placeholder="Primary crop" className={inputCls} value={form.currentCrop} onChange={set('currentCrop')} />
          <input placeholder="Season (e.g. Kharif, Rabi)" className={inputCls} value={form.season} onChange={set('season')} />
          <input type="date" className={inputCls} value={form.sowingDate} onChange={set('sowingDate')} />
          <input type="number" step="any" placeholder="Latitude" className={inputCls} value={form.latitude} onChange={set('latitude')} />
          <input type="number" step="any" placeholder="Longitude" className={inputCls} value={form.longitude} onChange={set('longitude')} />
          <div className="col-span-2 md:col-span-4 flex gap-2 items-center">
            <button className={btnPrimary}>{edit ? 'Update Farm' : 'Add Farm'}</button>
            {edit && <button type="button" className={btnGhost} onClick={() => { setEdit(null); setForm(empty); }}>Cancel</button>}
            <Link to="/map" className="text-sm text-green-700 font-semibold hover:underline flex items-center gap-1"><MapPin size={14} /> Pick coordinates on map</Link>
          </div>
        </form>
      </Card>

      {farms.length === 0 ? <Empty text="No farms added yet. Add your first farm above." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {farms.map(f => (
            <Card key={f._id} className={f.active ? 'border-green-400 ring-1 ring-green-200' : ''}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    {f.farmName}
                    {f.active && <Badge level="LOW">ACTIVE FARM</Badge>}
                  </h3>
                  <p className="text-sm text-gray-600">{[f.village, f.district, f.state].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <div className="flex gap-2 text-sm shrink-0">
                  <button className="text-blue-600 hover:underline" onClick={() => startEdit(f)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => del(f._id)}>Delete</button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {f.area} {f.unit} · {f.soilType} · {f.irrigationType} · Crop: {f.currentCrop || '—'}{f.season ? ` · ${f.season}` : ''}
              </p>
              <p className="text-sm text-gray-500">Lat {f.latitude ?? '—'}, Lng {f.longitude ?? '—'}</p>
              <div className="mt-2 flex gap-2">
                {!f.active && (
                  <button onClick={() => activate(f._id)} className="text-xs bg-green-700 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1 hover:bg-green-800">
                    <Star size={12} /> Set as active farm
                  </button>
                )}
                {f.latitude != null && f.longitude != null && (
                  <Link to="/map" className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 flex items-center gap-1">
                    <MapPin size={12} /> View on map
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="text-[11px] text-gray-400 flex items-center gap-2">
        <DataLabel type="database" source="MongoDB — your farms persist in the database" />
      </div>
    </div>
  );
}
