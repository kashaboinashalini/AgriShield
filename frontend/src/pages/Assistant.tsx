import { useEffect, useRef, useState } from 'react';
import { api, errMsg } from '../services/api';
import { Card, Empty, Spinner, PageHeader, DataLabel, inputCls, btnPrimary, fmtDateTime } from '../components/ui';

const SUGGESTED = [
  'What crop should I grow?',
  'Should I irrigate today?',
  'Why is my crop yellowing?',
  'How do I control pests without chemicals?',
  'What fertilizer should I use?',
  'Is rain expected?',
  'How can I improve profit?',
  'Eco-friendly farming practices',
];

// Render structured chatbot answers: markdown bold + line breaks
function renderText(text: string) {
  return (
    <>
      {String(text || '').split('\n').map((line, i) => (
        <div key={i}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            /^\*\*[^*]+\*\*$/.test(part) ? <strong key={j}>{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>
          )}
        </div>
      ))}
    </>
  );
}

const WELCOME = 'Namaste! 👋 I am AgriShield AI Assistant. Tell me your farming problem and I will give you an eco-friendly, step-by-step solution. Try asking in English or తెలుగు. 🌱';

export default function Assistant() {
  const [lang, setLang] = useState('English');
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [farmId, setFarmId] = useState('');
  const [ctx, setCtx] = useState<any>({});
  const end = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const fb = await api.get('/farms').then(r => r.data.data).catch(() => ({ data: [] }));
        const farms = fb.data || [];
        const farm = farms.find((f: any) => f._id === fb.activeFarmId) || farms[0] || null;
        const soil = await api.get('/soil').then(r => (r.data.data || [])[0]).catch(() => null);
        const irrigation = await api.get('/irrigation').then(r => (r.data.data || [])[0]).catch(() => null);
        const scan = await api.get('/scans/crop').then(r => (r.data.data || [])[0]).catch(() => null);
        if (farm) setFarmId(farm._id);
        setCtx({ farm, soil, irrigation, scan });
      } catch {}
    })();
    api.get('/chat/history')
      .then(r => {
        const rows = (r.data.data || []).map((m: any) => ({ role: m.role, message: m.message, language: m.language, createdAt: m.createdAt }));
        setMsgs(rows.length ? rows : [{ role: 'assistant', message: WELCOME }]);
      })
      .catch(() => setMsgs([{ role: 'assistant', message: WELCOME }]));
  }, []);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const sendText = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setMsgs((m: any[]) => [...(m || []), { role: 'user', message: t }]);
    setLoading(true);
    try {
      const r = await api.post('/chat', { message: t, language: lang, ...(farmId ? { farmId } : {}) });
      setMsgs((m: any[]) => [...(m || []), { role: 'assistant', message: r.data.data.reply, language: r.data.data.language }]);
    } catch (e: any) {
      setMsgs((m: any[]) => [...(m || []), { role: 'assistant', message: errMsg(e, 'Sorry, I could not process that. Please try again.') }]);
    } finally {
      setLoading(false);
    }
  };

  const send = (e: any) => {
    e.preventDefault();
    sendText(input);
    setInput('');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Assistant"
        subtitle="Ask questions about your farm — in English or తెలుగు"
        actions={
          <select className={inputCls + ' w-auto'} value={lang} onChange={e => setLang(e.target.value)}>
            <option>English</option>
            <option>తెలుగు</option>
          </select>
        }
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <Card className="h-[60vh] overflow-y-auto space-y-3">
            {!msgs ? <Spinner /> : msgs.length === 0 ? (
              <Empty text="No messages yet. Ask about crops, diseases, irrigation, soil, weather, or schemes." />
            ) : msgs.map((m: any, i: number) => (
              <div key={m._id || i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-green-700 text-white' : 'bg-green-50 text-gray-800 border border-green-100'}`}>
                {m.role !== 'user' && <div className="text-[10px] font-bold text-green-700 mb-1">🌾 AgriShield Assistant</div>}
                {renderText(m.message)}
                {m.createdAt && <div className="text-[10px] opacity-60 mt-1">{fmtDateTime(m.createdAt)}{m.language ? ` · ${m.language}` : ''}</div>}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-green-200 border-t-green-700 rounded-full animate-spin" />
                Assistant is typing…
              </div>
            )}
            <div ref={end} />
          </Card>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map(q => (
              <button key={q} type="button" onClick={() => sendText(q)} className="border border-green-200 text-green-800 text-xs rounded-full px-3 py-1.5 hover:bg-green-50">
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-2">
            <input
              className={inputCls + ' flex-1'}
              placeholder={lang === 'తెలుగు' ? 'మీ ప్రశ్న టైప్ చేయండి...' : 'Type your question...'}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button className={btnPrimary} disabled={loading}>Send</button>
          </form>
        </div>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Farm Context</h2>
            <DataLabel type="database" source="AgriShield records" />
          </div>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Current Farm</div>
              {ctx.farm ? (
                <>
                  <div className="font-semibold">{ctx.farm.farmName}</div>
                  <div className="text-gray-500 text-xs">{ctx.farm.village}{ctx.farm.district ? `, ${ctx.farm.district}` : ''}{ctx.farm.state ? `, ${ctx.farm.state}` : ''}</div>
                  {ctx.farm.currentCrop && <div className="text-gray-500 text-xs mt-0.5">Crop: {ctx.farm.currentCrop}</div>}
                </>
              ) : <div className="text-gray-400">No farm on record</div>}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Latest Soil Analysis</div>
              {ctx.soil ? (
                <div>Score <b>{ctx.soil.score}/100</b> · pH {ctx.soil.ph} ({ctx.soil.phCondition})</div>
              ) : <div className="text-gray-400">No soil analysis yet</div>}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Latest Irrigation Record</div>
              {ctx.irrigation ? (
                <div>{ctx.irrigation.crop} · moisture {ctx.irrigation.soilMoisture}%{ctx.irrigation.decision ? ` · ${ctx.irrigation.decision}` : ''}</div>
              ) : <div className="text-gray-400">No irrigation records</div>}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Latest Crop Scan</div>
              {ctx.scan ? (
                <div>{ctx.scan.crop} · {ctx.scan.disease} ({ctx.scan.confidence}%)</div>
              ) : <div className="text-gray-400">No crop scans yet</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
