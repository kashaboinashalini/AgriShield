import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Spinner, Empty, PageHeader, DataLabel, inputCls, btnPrimary } from '../components/ui';

// Fix default marker icons in bundled builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function FarmMap() {
  const [farms, setFarms] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [err, setErr] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    api.get('/farms')
      .then(r => { setFarms(r.data.data || []); })
      .catch(e => setErr(errMsg(e)));
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current).setView([17.5, 78.5], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Render markers whenever farms change
  useEffect(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group) return;
    group.clearLayers();
    let first = true;
    farms.forEach((f) => {
      if (f.latitude == null || f.longitude == null) return;
      const marker = L.marker([f.latitude, f.longitude]).addTo(group);
      marker.bindPopup(
        `<b>${f.farmName}</b><br/>${f.village || ''}, ${f.district || ''}, ${f.state || ''}<br/>` +
        `${f.area} ${f.unit}${f.currentCrop ? ' · ' + f.currentCrop : ''}<br/>` +
        `<span style="color:#666">${f.latitude}, ${f.longitude}</span>`
      );
      marker.on('click', () => setSelected(f));
      if (first) { map.setView([f.latitude, f.longitude], 11); first = false; }
    });
  }, [farms]);

  // Click map to pick a location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onClick = (e: L.LeafletMouseEvent) => setCoords({ lat: Math.round(e.latlng.lat * 100000) / 100000, lng: Math.round(e.latlng.lng * 100000) / 100000 });
    map.on('click', onClick);
    return () => { map.off('click', onClick); };
  }, []);

  const useBrowserLocation = () => {
    if (!navigator.geolocation) { setErr('Geolocation is not supported by this browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: Math.round(pos.coords.latitude * 100000) / 100000, lng: Math.round(pos.coords.longitude * 100000) / 100000 };
        setCoords(c);
        mapRef.current?.setView([c.lat, c.lng], 12);
      },
      () => setErr('Location permission denied. You can click anywhere on the map or enter coordinates manually.')
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Farm Map"
        subtitle="Real farm locations on OpenStreetMap"
        actions={
          <button onClick={useBrowserLocation} className={btnPrimary + ' flex items-center gap-1.5'}>
            <Navigation size={14} /> Use my location
          </button>
        }
      />
      {err && <Card className="text-red-600 text-sm">{err}</Card>}
      {!farms.length && !err ? <Spinner /> : null}

      <div className="grid lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold"><MapPin size={15} /> OpenStreetMap</div>
            <DataLabel type="database" source="OpenStreetMap tiles" />
          </div>
          <div ref={mapEl} className="h-96 w-full z-0" />
          <div className="px-4 py-2 text-xs text-gray-400 border-t">
            Click anywhere on the map to pick coordinates. Markers show farms with stored latitude/longitude.
          </div>
        </Card>

        <div className="space-y-3">
          {coords && (
            <Card>
              <div className="text-xs font-bold text-gray-500 mb-1.5">SELECTED LOCATION</div>
              <div className="text-sm font-mono">{coords.lat}, {coords.lng}</div>
              <div className="text-[11px] text-gray-400 mt-1">Enter these coordinates when adding or editing a farm so weather, risk and maps use the real location.</div>
            </Card>
          )}

          {selected && (
            <Card>
              <div className="text-xs font-bold text-gray-500 mb-1.5">SELECTED FARM</div>
              <div className="font-bold">{selected.farmName}</div>
              <div className="text-sm text-gray-600">{selected.village}, {selected.district}, {selected.state}</div>
              <div className="text-sm text-gray-600">{selected.area} {selected.unit} · {selected.soilType || '—'} · {selected.currentCrop || '—'}</div>
              <div className="text-xs font-mono text-gray-400 mt-1">{selected.latitude}, {selected.longitude}</div>
            </Card>
          )}

          <Card>
            <div className="text-xs font-bold text-gray-500 mb-2">YOUR FARMS ({farms.length})</div>
            {farms.length === 0 ? <Empty text="No farms added yet. Add your first farm with coordinates." /> : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {farms.map((f: any) => (
                  <li key={f._id}>
                    <button
                      onClick={() => {
                        setSelected(f);
                        if (f.latitude != null && f.longitude != null) mapRef.current?.setView([f.latitude, f.longitude], 13);
                      }}
                      className="w-full text-left border border-gray-100 rounded-xl p-2.5 hover:border-green-300 hover:bg-green-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{f.farmName} {f.active && <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 ml-1">ACTIVE</span>}</span>
                        <span className="text-xs text-gray-400">{f.area} {f.unit}</span>
                      </div>
                      <div className="text-xs text-gray-500">{f.village}, {f.district}</div>
                      <div className="text-[11px] font-mono text-gray-400">
                        {f.latitude != null ? `${f.latitude}, ${f.longitude}` : 'No coordinates stored'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
