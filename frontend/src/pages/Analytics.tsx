import { useEffect, useState } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { api, errMsg } from '../services/api';
import { Card, Spinner, Empty, PageHeader, DataLabel, inputCls, Badge } from '../components/ui';

const COLORS = ['#15803d', '#eab308', '#dc2626', '#3b82f6', '#a855f7'];

export default function Analytics() {
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('all');
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/farms')
      .then(r => setFarms(r.data.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let on = true;
    setLoading(true); setErr('');
    api.get(`/analytics/dashboard/${farmId}`)
      .then(r => { if (on) setD(r.data.data); })
      .catch((e: any) => { if (on) setErr(errMsg(e, 'Could not load analytics.')); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [farmId]);

  const t = d?.totals || {};

  return (
    <div className="space-y-4">
      <PageHeader
        title="Farm Analytics"
        subtitle="Historical trends across all farm activities"
        actions={
          <select className={inputCls + ' w-auto'} value={farmId} onChange={e => setFarmId(e.target.value)}>
            <option value="all">All Farms</option>
            {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
          </select>
        }
      />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {loading ? <Spinner /> : !d ? <Empty text="No analytics data available." /> : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Card className="flex-1 min-w-[200px]">
              <div className="text-sm text-gray-500">Farm Health Score</div>
              <div className="text-3xl font-bold text-green-700">{d.farmHealthScore}<span className="text-base text-gray-400">/100</span></div>
              <div className="text-xs text-gray-400 mt-1">{d.farmId === 'all' ? 'All farms' : 'Selected farm'}</div>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <Card><div className="text-sm text-gray-500">Crop Scans</div><b>{t.scans}</b></Card>
              <Card><div className="text-sm text-gray-500">Pest Scans</div><b>{t.pestScans}</b></Card>
              <Card><div className="text-sm text-gray-500">Soil Analyses</div><b>{t.soilAnalyses}</b></Card>
              <Card><div className="text-sm text-gray-500">Irrigations</div><b>{t.irrigations}</b></Card>
              <Card><div className="text-sm text-gray-500">Calculations</div><b>{t.calculations}</b></Card>
              <Card><div className="text-sm text-gray-500">Total Investment</div><b>₹{Math.round(t.totalInvestment || 0).toLocaleString('en-IN')}</b></Card>
              <Card><div className="text-sm text-gray-500">Total Revenue</div><b>₹{Math.round(t.totalRevenue || 0).toLocaleString('en-IN')}</b></Card>
              <Card><div className="text-sm text-gray-500">Total Profit</div><b className="text-green-700">₹{Math.round(t.totalProfit || 0).toLocaleString('en-IN')}</b></Card>
            </div>
          </div>
          {d.source && <div className="flex items-center gap-2"><DataLabel type="database" source={d.source} /><span className="text-xs text-gray-400">{d.dataType}</span></div>}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="h-72">
              <h3 className="font-bold mb-2">Crop Health Trend</h3>
              {(d.cropHealth || []).length === 0 ? <Empty text="No crop health data." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.cropHealth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#15803d" fill="#15803d" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="h-72">
              <h3 className="font-bold mb-2">Soil Health Score</h3>
              {(d.soilHealth || []).length === 0 ? <Empty text="No soil data." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.soilHealth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#65a30d" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="h-72">
              <h3 className="font-bold mb-2">Irrigation — Soil Moisture</h3>
              {(d.irrigation || []).length === 0 ? <Empty text="No irrigation data." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.irrigation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="soilMoisture" stroke="#3b82f6" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="h-72">
              <h3 className="font-bold mb-2">Weather — Temperature & Humidity</h3>
              {(d.weather || []).length === 0 ? <Empty text="No weather data." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.weather}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#dc2626" dot={false} />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="h-72">
              <h3 className="font-bold mb-2">Investment vs Revenue vs Profit</h3>
              {(d.profit || []).length === 0 ? <Empty text="No profit data." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.profit}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="investment" fill="#dc2626" />
                    <Bar dataKey="revenue" fill="#15803d" />
                    <Bar dataKey="profit" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="h-72">
              <h3 className="font-bold mb-2">Disease Detections</h3>
              {(d.diseaseDetections || []).length === 0 ? <Empty text="No disease detections." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.diseaseDetections} dataKey="count" nameKey="name" outerRadius={80} label>
                      {d.diseaseDetections.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="h-72">
              <h3 className="font-bold mb-2">Pest Detections</h3>
              {(d.pestDetections || []).length === 0 ? <Empty text="No pest detections." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.pestDetections} dataKey="count" nameKey="name" outerRadius={80} label>
                      {d.pestDetections.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card>
              <h3 className="font-bold mb-2">Risk History</h3>
              {(d.risk || []).length === 0 ? <Empty text="No risk history." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500"><th>Date</th><th>Overall</th><th>Weather</th><th>Disease</th><th>Pest</th><th>Water</th></tr></thead>
                    <tbody>{d.risk.map((r: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                        <td><Badge level={r.overall}>{r.overall}</Badge></td>
                        <td><Badge level={r.weather}>{r.weather}</Badge></td>
                        <td><Badge level={r.disease}>{r.disease}</Badge></td>
                        <td><Badge level={r.pest}>{r.pest}</Badge></td>
                        <td><Badge level={r.water}>{r.water}</Badge></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
