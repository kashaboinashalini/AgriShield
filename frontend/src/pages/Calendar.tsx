import { useEffect, useState } from 'react';
import { api, errMsg } from '../services/api';
import { Card, Badge, Empty, Spinner, PageHeader, inputCls, btnPrimary, btnGhost, Field } from '../components/ui';

const TYPES = ['irrigation', 'fertilizer', 'pesticide', 'weeding', 'harvesting', 'soil testing', 'crop monitoring', 'seed', 'sowing', 'disease', 'pest', 'harvest', 'custom'];
const PRIORITIES = ['low', 'medium', 'high'];
const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ title: '', farm: '', crop: '', dueDate: todayStr(), time: '', priority: 'medium', description: '', type: 'custom' });

export default function Calendar() {
  const [farms, setFarms] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, pending: 0, completed: 0, overdue: 0, upcoming: 0 });
  const [form, setForm] = useState<any>(emptyForm());
  const [genForm, setGenForm] = useState<any>({ farm: '', crop: 'Rice', sowingDate: todayStr() });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const [err, setErr] = useState('');
  const setF = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  const setG = (k: string) => (e: any) => setGenForm({ ...genForm, [k]: e.target.value });
  const setE = (k: string) => (e: any) => setEditForm({ ...editForm, [k]: e.target.value });

  const load = async () => {
    try {
      const r = await api.get('/tasks');
      setTasks(r.data.data.data);
      setSummary(r.data.data.summary || {});
    } catch (e: any) {
      setErr(errMsg(e, 'Could not load tasks.'));
    } finally {
      setInitial(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/farms')
      .then(r => {
        const body = r.data.data;
        setFarms(body.data || []);
        if (body.activeFarmId) {
          setForm((f: any) => ({ ...f, farm: body.activeFarmId }));
          setGenForm((g: any) => ({ ...g, farm: body.activeFarmId }));
        }
      })
      .catch(() => {});
  }, []);

  const addTask = async (e: any) => {
    e.preventDefault();
    const payload: any = { ...form };
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
    try {
      await api.post('/tasks', payload);
      setForm(emptyForm());
      load();
    } catch (e: any) {
      setErr(errMsg(e, 'Could not add task.'));
    }
  };

  const complete = async (id: string) => {
    try { await api.patch(`/tasks/${id}/complete`); load(); }
    catch (e: any) { setErr(errMsg(e, 'Could not update task.')); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/tasks/${id}`); load(); }
    catch (e: any) { setErr(errMsg(e, 'Could not delete task.')); }
  };

  const startEdit = (t: any) => { setEditing(t._id); setEditForm({ ...t }); };

  const saveEdit = async (e: any) => {
    e.preventDefault();
    if (!editForm || !editing) return;
    const payload: any = { ...editForm };
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
    try {
      await api.put(`/tasks/${editing}`, payload);
      setEditing(null); setEditForm(null);
      load();
    } catch (e: any) {
      setErr(errMsg(e, 'Could not update task.'));
    }
  };

  const generate = async (e: any) => {
    e.preventDefault();
    const payload: any = { ...genForm };
    if (!payload.farm) delete payload.farm;
    setLoading(true);
    try {
      await api.post('/calendar/generate', payload);
      load();
    } catch (e: any) {
      setErr(errMsg(e, 'Could not generate crop calendar.'));
    } finally {
      setLoading(false);
    }
  };

  const today = todayStr();
  const overdue = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate.slice(0, 10) < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const upcoming = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate.slice(0, 10) >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completed = tasks.filter(t => t.status === 'completed').sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const renderTask = (t: any) => {
    if (editing === t._id) {
      return (
        <Card key={t._id}>
          <form onSubmit={saveEdit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Title"><input required className={inputCls} value={editForm.title} onChange={setE('title')} /></Field>
            <Field label="Farm">
              <select className={inputCls} value={editForm.farm || ''} onChange={setE('farm')}>
                <option value="">— None —</option>
                {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
              </select>
            </Field>
            <Field label="Crop"><input className={inputCls} value={editForm.crop || ''} onChange={setE('crop')} /></Field>
            <Field label="Due date"><input required type="date" className={inputCls} value={editForm.dueDate ? editForm.dueDate.slice(0, 10) : ''} onChange={setE('dueDate')} /></Field>
            <Field label="Time"><input type="time" className={inputCls} value={editForm.time || ''} onChange={setE('time')} /></Field>
            <Field label="Priority">
              <select className={inputCls} value={editForm.priority || 'medium'} onChange={setE('priority')}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className={inputCls} value={editForm.type || 'custom'} onChange={setE('type')}>
                {TYPES.map(tp => <option key={tp}>{tp}</option>)}
              </select>
            </Field>
            <Field label="Description"><textarea className={inputCls} value={editForm.description || ''} onChange={setE('description')} /></Field>
            <div className="col-span-2 md:col-span-4 flex gap-2">
              <button className={btnPrimary} type="submit">Save</button>
              <button className={btnGhost} type="button" onClick={() => { setEditing(null); setEditForm(null); }}>Cancel</button>
            </div>
          </form>
        </Card>
      );
    }
    return (
      <Card key={t._id} className="flex items-start gap-3">
        {t.status !== 'completed' && (
          <input type="checkbox" onChange={() => complete(t._id)} className="w-5 h-5 mt-1" title="Mark complete" />
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${t.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{t.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {t.type}{t.crop ? ` · ${t.crop}` : ''} · Due {new Date(t.dueDate).toLocaleDateString('en-IN')}{t.time ? ` ${t.time}` : ''}
          </div>
          {t.description && <div className="text-sm text-gray-600 mt-1">{t.description}</div>}
        </div>
        <div className="flex items-center gap-2">
          <Badge level={(t.priority || 'medium') === 'high' ? 'HIGH' : (t.priority || 'medium') === 'low' ? 'LOW' : 'MEDIUM'}>{(t.priority || 'medium').toUpperCase()}</Badge>
          <button onClick={() => startEdit(t)} className="text-xs text-green-700 underline">Edit</button>
          <button onClick={() => remove(t._id)} className="text-xs text-red-600 underline">Delete</button>
        </div>
      </Card>
    );
  };

  const section = (title: string, list: any[], tone = '') => (
    list.length > 0 && (
      <section>
        <h2 className={`font-bold mb-2 ${tone}`}>{title} ({list.length})</h2>
        <div className="space-y-2">{list.map(renderTask)}</div>
      </section>
    )
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Farm Calendar" subtitle="Plan, track and complete farming tasks" />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><div className="text-sm text-gray-500">Pending</div><div className="text-2xl font-bold">{summary.pending}</div></Card>
        <Card><div className="text-sm text-gray-500">Upcoming</div><div className="text-2xl font-bold">{summary.upcoming}</div></Card>
        <Card><div className="text-sm text-gray-500">Overdue</div><div className="text-2xl font-bold text-red-600">{summary.overdue}</div></Card>
        <Card><div className="text-sm text-gray-500">Completed</div><div className="text-2xl font-bold text-green-700">{summary.completed}</div></Card>
      </div>
      <Card>
        <h2 className="font-bold mb-2">Generate Crop Calendar</h2>
        <form onSubmit={generate} className="flex flex-wrap gap-3 items-end">
          <Field label="Farm (optional)">
            <select className={inputCls} value={genForm.farm} onChange={setG('farm')}>
              <option value="">— Select farm —</option>
              {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
            </select>
          </Field>
          <Field label="Crop"><input required className={inputCls} value={genForm.crop} onChange={setG('crop')} /></Field>
          <Field label="Sowing date"><input required type="date" className={inputCls} value={genForm.sowingDate} onChange={setG('sowingDate')} /></Field>
          <button className={btnPrimary} disabled={loading}>{loading ? 'Generating…' : 'Generate Crop Calendar'}</button>
        </form>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Add Task</h2>
        <form onSubmit={addTask} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Title"><input required className={inputCls} value={form.title} onChange={setF('title')} /></Field>
          <Field label="Farm (optional)">
            <select className={inputCls} value={form.farm} onChange={setF('farm')}>
              <option value="">— None —</option>
              {farms.map((f: any) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
            </select>
          </Field>
          <Field label="Crop (optional)"><input className={inputCls} value={form.crop} onChange={setF('crop')} /></Field>
          <Field label="Due date"><input required type="date" className={inputCls} value={form.dueDate} onChange={setF('dueDate')} /></Field>
          <Field label="Time (optional)"><input type="time" className={inputCls} value={form.time} onChange={setF('time')} /></Field>
          <Field label="Priority">
            <select className={inputCls} value={form.priority} onChange={setF('priority')}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={setF('type')}>
              {TYPES.map(tp => <option key={tp}>{tp}</option>)}
            </select>
          </Field>
          <Field label="Description (optional)"><textarea className={inputCls} value={form.description} onChange={setF('description')} /></Field>
          <div className="col-span-2 md:col-span-4"><button className={btnPrimary}>Add Task</button></div>
        </form>
      </Card>
      {initial ? <Spinner /> : (
        <>
          {section('⚠️ Overdue', overdue, 'text-red-600')}
          {section('📅 Upcoming', upcoming, 'text-amber-600')}
          {section('✅ Completed', completed, 'text-green-700')}
          {tasks.length === 0 && <Empty text="No tasks yet. Add a task or generate a crop calendar above." />}
        </>
      )}
    </div>
  );
}
