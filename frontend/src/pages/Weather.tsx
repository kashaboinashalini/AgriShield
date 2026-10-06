import { useCallback, useEffect, useState } from 'react';
import { CloudSun, RefreshCw, AlertTriangle, Droplets, Wind, Sunrise, Thermometer, CloudRain, Gauge, Eye, Compass } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Badge, Spinner, PageHeader, DataLabel, Empty, btnPrimary } from '../components/ui';
import { useLang } from '../context/LanguageContext';

export default function Weather() {
  const { t } = useLang();
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState<string>('');
  const [w, setW] = useState<any>(null);
  const [fc, setFc] = useState<any>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'current' | 'forecast'>('current');

  useEffect(() => {
    api.get('/farms').then(r => {
      const list = r.data.data || [];
      setFarms(list);
      const active = list.find((f: any) => f.active);
      if (active) setFarmId(active._id);
      else if (list[0]) setFarmId(list[0]._id);
    }).catch(() => {});
  }, []);

  const load = useCallback(async (id = farmId, showSpinner = false) => {
    if (!id) { setLoading(false); return; }
    if (showSpinner) setLoading(true);
    setErr('');
    setUnavailable(null);
    try {
      const [cur, f] = await Promise.all([
        api.get(`/weather/current/${id}`),
        api.get(`/weather/forecast/${id}`),
      ]);
      setW(cur.data.data);
      setFc(f.data.data);
      setUnavailable(null);
    } catch (e: any) {
      // 503 = weather service unavailable — show honestly, never fake data
      if (e.response?.status === 503) {
        setUnavailable(e.response.data?.message || 'Live weather data is temporarily unavailable. Please try again.');
        setW(null);
        setFc(null);
      } else {
        setErr(errMsg(e, 'Failed to load weather.'));
      }
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => { if (farmId) load(farmId); }, [farmId]); // eslint-disable-line

  const metric = (icon: any, label: string, value: any) => (
    <div className="border border-gray-100 rounded-xl p-3 text-sm">
      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">{icon} {label}</div>
      <div className="font-bold text-base">{value}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('weather')}
        subtitle="Real-time weather for your farm location from the weather API"
        actions={
          <div className="flex gap-2">
            <select value={farmId} onChange={e => setFarmId(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {farms.length === 0 && <option value="">No farms yet</option>}
              {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName} — {f.district}</option>)}
            </select>
            <button onClick={() => load(farmId, true)} disabled={loading} className={btnPrimary + ' flex items-center gap-1.5'}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('refresh')}
            </button>
          </div>
        }
      />

      {farms.length === 0 && (
        <Card><Empty text="Add a farm with location details first — weather is fetched using real farm coordinates." /></Card>
      )}

      {err && <Card className="text-red-600 text-sm">{err}</Card>}

      {loading ? <Spinner /> : (
        <>
          {unavailable && (
            <Card>
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800">{t('liveData')}</p>
                    <DataLabel type="unavailable" />
                  </div>
                  <p className="text-sm text-gray-500">{unavailable}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cause: no WEATHER_API_KEY configured, or the weather provider is unreachable.
                    The rest of AgriShield (farms, soil, scans, calculator, calendar) continues to work normally.
                  </p>
                  <button onClick={() => load(farmId, true)} className="mt-2 text-green-700 font-semibold text-sm hover:underline">Try again</button>
                </div>
              </div>
            </Card>
          )}

          {w && (
            <>
              <Card>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h2 className="font-bold mr-auto flex items-center gap-2"><CloudSun size={18} /> {w.location}</h2>
                  <DataLabel type="live" source={w.source} />
                  <span className="text-xs text-gray-400">{t('lastUpdated')}: {new Date(w.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {metric(<Thermometer size={13} />, 'Temperature', `${w.temperature}°C`)}
                  {metric(<Thermometer size={13} />, 'Feels Like', `${w.feelsLike}°C`)}
                  {metric(<Droplets size={13} />, 'Humidity', `${w.humidity}%`)}
                  {metric(<CloudRain size={13} />, 'Rainfall Chance', `${w.rainProbability}%`)}
                  {metric(<CloudRain size={13} />, 'Rainfall (1h)', `${w.rainfall ?? 0} mm`)}
                  {metric(<Wind size={13} />, 'Wind', `${w.windSpeed} km/h${w.windDirection ? ` ${w.windDirection}` : ''}`)}
                  {metric(<Eye size={13} />, 'Cloud Cover', `${w.cloudCover ?? '—'}%`)}
                  {metric(<Gauge size={13} />, 'Pressure', `${w.pressure ?? '—'} hPa`)}
                  {metric(<Sunrise size={13} />, 'Sunrise / Sunset', `${w.sunrise} / ${w.sunset}`)}
                  {metric(<Compass size={13} />, 'Condition', <span className="capitalize text-sm">{w.condition}</span>)}
                </div>
              </Card>

              <Card>
                <div className="flex gap-2 mb-3 border-b border-gray-100 pb-2">
                  <button onClick={() => setTab('current')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === 'current' ? 'bg-green-700 text-white' : 'text-gray-500'}`}>Today</button>
                  <button onClick={() => setTab('forecast')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === 'forecast' ? 'bg-green-700 text-white' : 'text-gray-500'}`}>5–7 Day Forecast</button>
                </div>
                {tab === 'current' ? (
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1.5">{t('recommendations_weather')} — generated from actual weather conditions</div>
                    {w.recommendations?.length ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {w.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    ) : <Empty text="No specific recommendations for current conditions." />}
                  </div>
                ) : (
                  fc ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {fc.forecast?.map((f: any, i: number) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-3 text-center text-sm">
                          <div className="font-bold">{i === 0 ? 'Today' : f.day}</div>
                          <div className="text-[11px] text-gray-400 capitalize">{f.condition}</div>
                          <div className="font-bold mt-1">{f.tempMax}° / {f.tempMin}°</div>
                          <div className="text-xs text-blue-600">🌧️ {f.rainProbability}%</div>
                        </div>
                      ))}
                    </div>
                  ) : <Empty text="Forecast unavailable." />
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
