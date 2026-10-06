import { useEffect, useState } from 'react';
import { CloudSun, Bug, Droplets, CalendarDays, TrendingUp, Landmark, Info, Trash2 } from 'lucide-react';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, Badge, btnGhost, fmtDateTime } from '../components/ui';

const ICONS: Record<string, any> = {
  weather: CloudSun,
  disease: Bug,
  pest: Bug,
  irrigation: Droplets,
  task: CalendarDays,
  market: TrendingUp,
  scheme: Landmark,
  system: Info,
};

export default function Notifications() {
  const [items, setItems] = useState<any[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const r = await api.get('/notifications');
      setItems(r.data.data.data);
      setUnread(r.data.data.unread || 0);
    } catch (e: any) {
      setErr(errMsg(e, 'Could not load notifications.'));
    }
  };
  useEffect(() => { load(); }, []);

  const read = async (id: string) => {
    try { await api.put(`/notifications/${id}/read`); load(); }
    catch (e: any) { setErr(errMsg(e, 'Could not mark notification as read.')); }
  };
  const readAll = async () => {
    try { await api.put('/notifications/read-all'); load(); }
    catch (e: any) { setErr(errMsg(e, 'Could not mark notifications as read.')); }
  };
  const remove = async (id: string) => {
    try { await api.delete(`/notifications/${id}`); load(); }
    catch (e: any) { setErr(errMsg(e, 'Could not delete notification.')); }
  };

  const groups = (items || []).reduce((acc: any, n: any) => {
    const t = n.type || 'system';
    (acc[t] = acc[t] || []).push(n);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        subtitle="Alerts about weather, crops, tasks and markets"
        actions={
          <div className="flex items-center gap-2">
            {unread > 0 && <Badge level="MEDIUM">{unread} unread</Badge>}
            <button onClick={readAll} className={btnGhost}>Mark all as read</button>
          </div>
        }
      />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {items === null ? <Spinner /> : items.length === 0 ? <Empty text="No notifications." /> : (
        Object.entries(groups).map(([type, list]: any) => {
          const Icon = ICONS[type] || Info;
          return (
            <section key={type}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-green-700" />
                <h2 className="font-bold capitalize">{type}</h2>
                <span className="text-xs text-gray-400">({list.length})</span>
              </div>
              <div className="space-y-2">
                {list.map((n: any) => (
                  <Card key={n._id} className={`flex justify-between items-start gap-3 ${n.read ? 'opacity-60' : 'border-l-4 border-l-green-700'}`}>
                    <div className="min-w-0">
                      <h3 className="font-bold">{n.title}</h3>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{fmtDateTime(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.read && <button onClick={() => read(n._id)} className="text-sm text-green-700 underline">Mark read</button>}
                      <button onClick={() => remove(n._id)} className="text-gray-400 hover:text-red-600" title="Delete notification">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
