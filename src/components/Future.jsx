import { useEffect, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useLang } from '../lib/i18n.jsx';
import { fmtDate } from '../lib/constants.js';
import { IconLock } from './Icons.jsx';
import { LETTER_FIELDS } from './Feed.jsx';

const PRESETS = [['week', 'p1w'], ['month', 'p1m'], ['year', 'p1y'], ['custom', 'pCustom']];
const UNITS = [['ngày', 'uDay'], ['tuần', 'uWeek'], ['tháng', 'uMonth'], ['năm', 'uYear']];

function openDate(preset, n, unit) {
  const d = new Date();
  let k = 1, u = 'tháng';
  if (preset === 'week') u = 'tuần';
  else if (preset === 'year') u = 'năm';
  else if (preset === 'custom') { k = Math.max(1, Math.min(99, parseInt(n, 10) || 1)); u = unit; }
  if (u === 'ngày') d.setDate(d.getDate() + k);
  else if (u === 'tuần') d.setDate(d.getDate() + 7 * k);
  else if (u === 'tháng') d.setMonth(d.getMonth() + k);
  else d.setFullYear(d.getFullYear() + k);
  return d;
}

export default function Future({ ctx, refreshKey }) {
  const { t, f: tf } = useLang();
  const [draft, setDraft] = useState('');
  const [preset, setPreset] = useState('month');
  const [n, setN] = useState('3');
  const [unit, setUnit] = useState('tháng');
  const [list, setList] = useState([]);
  const [reload, setReload] = useState(0);
  const at = openDate(preset, n, unit);

  useEffect(() => {
    supabase.from('letters').select(LETTER_FIELDS).eq('kind', 'future').eq('author_id', ctx.profile.id)
      .order('open_at').then(({ data }) => setList(data || []));
  }, [reload, refreshKey]);

  async function submit() {
    const body = draft.trim();
    if (body.length < 5) return;
    const { error } = await supabase.from('letters').insert({ kind: 'future', body, open_at: at.toISOString(), mood: 'Thư tương lai', paper: 'xanh', stamp: 'may' });
    if (error) { ctx.toast(errText(error, t)); return; }
    setDraft(''); setReload((r) => r + 1);
    ctx.toast(tf('tSealed', { d: fmtDate(at) }));
  }

  const now = Date.now();
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div className="two-col">
        <div className="col-main">
          <div>
            <p className="eyebrow">{t.future}</p>
            <h1 className="display h-md">{t.toFutureMe}</h1>
            <p className="lead" style={{ marginTop: 10 }}>{t.futureLead}</p>
          </div>
          <label htmlFor="future-body" className="sr">{t.futureContent}</label>
          <textarea id="future-body" className="write-area lined sheet paper-xanh pat-lines" maxLength={2000} placeholder={t.futurePh}
            value={draft} onChange={(e) => setDraft(e.target.value)} style={{ height: 432, paddingRight: 40 }} />
        </div>
        <aside className="panel col-side">
          <span className="label">{t.openAfter}</span>
          <div className="grid-2" role="group" aria-label={t.openWhen}>
            {PRESETS.map(([id, label]) => <button key={id} className={preset === id ? 'chip is-on' : 'chip'} aria-pressed={preset === id} onClick={() => setPreset(id)}>{t[label]}</button>)}
          </div>
          {preset === 'custom' && (
            <div className="grid-2">
              <div className="fieldset"><label htmlFor="custom-n" className="small-lbl">{t.number}</label>
                <input id="custom-n" className="field" type="number" min="1" max="99" value={n} onChange={(e) => setN(e.target.value)} /></div>
              <div className="fieldset"><label htmlFor="custom-unit" className="small-lbl">{t.unit}</label>
                <select id="custom-unit" className="field" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map(([u, k]) => <option key={u} value={u}>{t[k]}</option>)}
                </select></div>
            </div>
          )}
          <div className="date-box"><span>{t.opensOnLbl}</span><span className="display">{fmtDate(at)}</span></div>
          <button className="btn btn-primary wide" onClick={submit} disabled={draft.trim().length < 5}>{t.sealSend}</button>
        </aside>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>{t.waiting}</h2>
        {list.length === 0 && <p className="empty" style={{ padding: '16px 0', textAlign: 'left' }}>{t.noFuture}</p>}
        <div className="grid-cards">
          {list.map((f) => {
            const ready = new Date(f.open_at).getTime() <= now;
            const days = Math.max(1, Math.ceil((new Date(f.open_at).getTime() - now) / 864e5));
            return (
              <div key={f.id} className="future-card">
                <div className="card-flap"><span className="card-seal" /></div>
                <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t.writtenOn} {fmtDate(f.created_at)}</span>
                  <span className="display" style={{ fontSize: 20, fontWeight: 600 }}>{t.openOn} {fmtDate(f.open_at)}</span>
                  {ready
                    ? <button className="btn btn-primary" style={{ alignSelf: 'flex-start', height: 44 }} onClick={() => ctx.openLetter(f, 'future')}>{t.arrivedOpen}</button>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted)' }}><IconLock size={16} />{tf('daysLeft', { n: days })}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
