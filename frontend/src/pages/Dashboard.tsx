import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldAlert, Droplets, Sprout, CloudSun, IndianRupee, Ruler, RefreshCw, Bell, CalendarDays, Activity, MapPin, AlertTriangle } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Stat, Badge, Spinner, Empty, PageHeader, DataLabel, timeAgo } from '../components/ui';

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    setErr('');
    try {
      const r = await api.get('/dashboard');
      setD(r.data.data);
    } catch (e: any) {
      setErr(errMsg(e, 'Failed to load dashboard.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (err && !d) return <Card className="text-red-600">{err}</Card>;
  if (!d) return <Spinner />;

  const riskBadge = (r: string) => <Badge level={r} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Farmer Dashboard"
        subtitle={d.activeFarm ? `${d.activeFarm.name} · ${d.activeFarm.village}, ${d.activeFarm.district}, ${d.activeFarm.state}` : 'Add a farm to get started'}
        actions={
          <button onClick={() => load(true)} disabled={refreshing} className="border border-gray-200 hover:bg-gray-50 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />
      {err && <Card className="text-red-600 text-sm">{err}</Card>}

      {/* Core metric cards — every card shows value, status, source, last updated */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Ruler />} label="Farm Area" value={`${d.farmArea} acres`} sub={`${d.farmCount} farm${d.farmCount === 1 ? '' : 's'}`} source="DATABASE DATA" updated={timeAgo(d.updatedAt)} />
        <Stat
          icon={<Leaf />} label="Crop Health"
          value={d.cropHealth != null ? `${d.cropHealth}%` : '—'}
          sub={d.cropHealthLabel}
          source={d.cropHealth != null ? 'DATABASE DATA' : 'NO SCANS YET'}
          updated={d.cropHealth != null ? timeAgo(d.updatedAt) : undefined}
        />
        <Stat icon={<ShieldAlert />} label="Disease Risk" value={riskBadge(d.diseaseRisk)} sub={d.diseaseRiskReason} source="CALCULATED DATA" updated={timeAgo(d.updatedAt)} />
        <Stat icon={<Sprout />} label="Soil Health" value={d.soilHealth} sub={d.soilScore != null ? `Score ${d.soilScore}/100` : 'Run a soil analysis'} source={d.soilScore != null ? 'DATABASE DATA' : 'NO ANALYSIS YET'} updated={timeAgo(d.updatedAt)} />
        <Stat icon={<Droplets />} label="Water Status" value={d.waterStatus === 'No data' ? '—' : <Badge level={d.waterStatus} />} sub={d.waterStatus === 'No data' ? 'Run the Irrigation Advisor' : d.waterStatus.replace(/_/g, ' ')} source={d.waterStatus === 'No data' ? 'NO RECORDS YET' : 'DATABASE DATA'} updated={timeAgo(d.updatedAt)} />
        <Stat icon={<CloudSun />} label="Weather Risk" value={riskBadge(d.weatherRisk)} sub={d.weatherRiskReason} source={d.weatherUnavailable ? 'ESTIMATED — WEATHER UNAVAILABLE' : 'CALCULATED FROM LIVE WEATHER'} updated={timeAgo(d.updatedAt)} />
        <Stat icon={<IndianRupee />} label="Estimated Profit" value={d.estimatedProfit != null ? `₹${d.estimatedProfit.toLocaleString('en-IN')}` : '—'} sub={d.estimatedProfit != null ? 'Latest calculation' : 'Use the Profit Calculator'} source={d.estimatedProfit != null ? 'DATABASE DATA' : 'NO CALCULATIONS YET'} updated={timeAgo(d.updatedAt)} />
        <Stat icon={<Activity />} label="Overall Risk" value={riskBadge(d.overallRisk)} sub={`${d.totalScans} scans total`} source="CALCULATED DATA" updated={timeAgo(d.updatedAt)} />
      </div>

      {/* Weather card — live data or honest unavailability, never fake */}
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="font-bold mr-auto">Current Weather {d.activeFarm ? `— ${d.activeFarm.village}, ${d.activeFarm.district}` : ''}</h2>
          {d.weather ? (
            <DataLabel type="live" source="OpenWeather" />
          ) : (
            <DataLabel type="unavailable" />
          )}
        </div>
        {d.weather ? (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span>🌡️ <b>{d.weather.temperature}°C</b> <span className="text-gray-400">(feels {d.weather.feelsLike}°C)</span></span>
              <span>💧 Humidity <b>{d.weather.humidity}%</b></span>
              <span>🌧️ Rain chance <b>{d.weather.rainProbability}%</b></span>
              <span>💨 Wind <b>{d.weather.windSpeed} km/h{d.weather.windDirection ? ` ${d.weather.windDirection}` : ''}</b></span>
              <span>☁️ <span className="capitalize">{d.weather.condition}</span></span>
              {d.weather.pressure != null && <span>🎚️ Pressure <b>{d.weather.pressure} hPa</b></span>}
              {d.weather.cloudCover != null && <span>🌥️ Clouds <b>{d.weather.cloudCover}%</b></span>}
              <span>🌅 {d.weather.sunrise} – {d.weather.sunset}</span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Source: {d.weather.source} · Updated: {new Date(d.weather.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {(d.weather.recommendations || []).length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-gray-500 mb-1">AGRICULTURAL RECOMMENDATIONS (from live weather)</div>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                  {d.weather.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-start gap-3 text-sm">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-700">Live weather data is temporarily unavailable.</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {d.weatherSource === 'Weather API unavailable'
                  ? 'No weather API key is configured on the server (WEATHER_API_KEY). Add a key in backend/.env to enable live weather.'
                  : 'Please try again in a moment. All other dashboard data comes from your farm records.'}
              </p>
              {d.lastWeatherRecord && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Last recorded weather: {d.lastWeatherRecord.condition}, {d.lastWeatherRecord.temperature}°C ({timeAgo(d.lastWeatherRecord.date)})
                </p>
              )}
              <button onClick={() => load(true)} className="mt-2 text-green-700 font-semibold text-xs hover:underline">Try again</button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        {/* Recent activities */}
        <Card>
          <h3 className="font-bold mb-2 flex items-center gap-1.5 text-sm"><Activity size={15} /> Recent Activities</h3>
          {d.recentActivities?.length ? (
            <ul className="space-y-2">
              {d.recentActivities.map((a: any) => (
                <li key={a.id} className="flex items-start gap-2 text-sm border-b border-gray-50 pb-2 last:border-0">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate">{a.text}</div>
                    <div className="text-[11px] text-gray-400">{a.ago}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty text="No activity yet. Add a farm, scan a crop, or analyze soil." />}
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold flex items-center gap-1.5 text-sm"><Bell size={15} /> Notifications</h3>
            {d.unreadNotifications > 0 && <Badge level="MEDIUM">{d.unreadNotifications} new</Badge>}
          </div>
          {d.notifications?.length ? (
            <ul className="space-y-2">
              {d.notifications.map((n: any) => (
                <li key={n.id} className={`text-sm border-b border-gray-50 pb-2 last:border-0 ${n.read ? 'opacity-60' : ''}`}>
                  <div className="font-semibold text-xs">{n.title}</div>
                  <div className="text-gray-600 text-xs line-clamp-2">{n.message}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{n.ago}</div>
                </li>
              ))}
            </ul>
          ) : <Empty text={d.notifications ? 'No notifications.' : 'No notifications.'} />}
          <Link to="/notifications" className="text-xs text-green-700 font-semibold hover:underline">View all →</Link>
        </Card>

        {/* Upcoming tasks */}
        <Card>
          <h3 className="font-bold mb-2 flex items-center gap-1.5 text-sm"><CalendarDays size={15} /> Upcoming Tasks</h3>
          {d.upcomingTasks?.length ? (
            <ul className="space-y-2">
              {d.upcomingTasks.map((t: any) => (
                <li key={t.id} className="text-sm border-b border-gray-50 pb-2 last:border-0">
                  <div className="font-semibold text-xs">{t.title}</div>
                  <div className="text-[11px] text-gray-400">
                    {new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {t.crop ? ` · ${t.crop}` : ''}
                    {t.priority === 'high' && <Badge level="HIGH">HIGH</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty text="No upcoming tasks. Generate a crop calendar." />}
          <Link to="/calendar" className="text-xs text-green-700 font-semibold hover:underline">Open calendar →</Link>
        </Card>
      </div>

      {d.riskActions?.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <h3 className="font-bold mb-1.5 flex items-center gap-1.5 text-sm"><MapPin size={14} /> Recommended Actions <Badge level={d.overallRisk} /></h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
            {d.riskActions.map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}
