import { useEffect, useState } from 'react';
import { supabase, viError } from '../lib/supabase.js';
import { seasonStatus, yearOptions, yearRange } from '../lib/constants.js';
import { LETTER_FIELDS } from './Feed.jsx';

const BPOS = [[44, 372, -10], [98, 392, 6], [150, 366, -4], [198, 404, 12], [66, 462, 16], [126, 474, -14], [180, 484, 8], [30, 486, -4]];

function Bottle({ ribbon, sealed, scrolls, onOpen }) {
  return (
    <div className="bottle-wrap">
      <div className="bottle" style={{ '--ribbon': ribbon }}>
        <svg className="bottle-svg" viewBox="0 0 240 520" preserveAspectRatio="none" aria-hidden="true">
          <path className="g-glass" d="M92 78 L92 150 C92 194 20 204 20 254 L20 478 Q20 510 52 510 L188 510 Q220 510 220 478 L220 254 C220 204 148 194 148 150 L148 78 Z" />
          <ellipse cx="120" cy="497" rx="80" ry="8" fill="#ffffff" opacity=".45" />
          <rect className="g-cork" x="97" y="6" width="46" height="68" rx="9" />
          <circle className="g-dot" cx="110" cy="20" r="3" /><circle className="g-dot" cx="128" cy="30" r="2.5" />
          <circle className="g-dot" cx="116" cy="44" r="3.5" /><circle className="g-dot" cx="132" cy="52" r="2" /><circle className="g-dot" cx="106" cy="38" r="2" />
          <rect className="g-glass" x="84" y="58" width="72" height="22" rx="10" />
        </svg>
        {scrolls.slice(0, 8).map((s, i) => (
          <button key={s.id} className="scroll-btn" onClick={() => onOpen(s)} aria-label={`Mở cuộn thư số ${i + 1}`}
            style={{ left: BPOS[i][0], top: BPOS[i][1], transform: `rotate(${BPOS[i][2]}deg)` }}>
            <span className="scroll" style={{ animationDelay: `${-((i * 0.7) % 4)}s` }} />
          </button>
        ))}
        <svg className="bottle-svg" viewBox="0 0 240 520" preserveAspectRatio="none" aria-hidden="true" style={{ pointerEvents: 'none' }}>
          <path className="g-hl" d="M42 282 L42 440" /><path className="g-hl" d="M42 462 L42 472" />
          <path className="g-hl" d="M105 92 L105 142" style={{ strokeWidth: 7 }} />
          <path className="g-hl" d="M198 300 L198 390" style={{ strokeWidth: 6, opacity: 0.45 }} />
        </svg>
        {sealed && <span className="wax" aria-hidden="true" />}
      </div>
    </div>
  );
}

export default function Seasons({ ctx, initialSeason, refreshKey }) {
  const [seasons, setSeasons] = useState(null);
  const [sid, setSid] = useState(initialSeason || null);
  const [year, setYear] = useState('all');
  const [scrolls, setScrolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [draft, setDraft] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase.from('seasons').select('*').order('open_date').then(({ data }) => {
      const list = data || [];
      setSeasons(list);
      if (!sid && list.length) setSid((list.find((s) => seasonStatus(s) === 'open') || list[0]).id);
    });
  }, [refreshKey]);

  useEffect(() => { if (initialSeason) setSid(initialSeason); }, [initialSeason]);

  useEffect(() => {
    if (!sid) return;
    let q = supabase.from('letters').select(LETTER_FIELDS, { count: 'exact' })
      .eq('kind', 'scroll').eq('season_id', sid).eq('status', 'visible')
      .order('created_at', { ascending: false }).limit(8);
    if (year !== 'all') { const [a, b] = yearRange(year); q = q.gte('created_at', a).lt('created_at', b); }
    q.then(({ data, count }) => { setScrolls(data || []); setTotal(count || 0); });
  }, [sid, year, reload, refreshKey]);

  if (!seasons) return <p className="empty">Đang tải…</p>;
  if (!seasons.length) return <p className="empty">Chưa có hũ thư mùa nào. Quản trị viên sẽ sớm mở hũ đầu tiên.</p>;

  const season = seasons.find((s) => s.id === sid) || seasons[0];
  const st = seasonStatus(season);

  async function submit() {
    const body = draft.trim();
    if (body.length < 5) return;
    const { error } = await supabase.from('letters').insert({ kind: 'scroll', season_id: season.id, mood: season.name, body, stamp: 'hoa' });
    if (error) { ctx.toast(viError(error)); return; }
    setDraft(''); setReload((r) => r + 1);
    ctx.toast('Cuộn thư của bạn đã nằm trong chai.');
  }

  const countLabel = total === 0
    ? (year === 'all' ? 'Chưa có cuộn thư nào trong chai.' : `Năm ${year} chưa có cuộn thư nào cho dịp này.`)
    : `Trong chai có ${total} cuộn thư${total > 8 ? ' — đang hiện 8 cuộn mới nhất' : ''}. Chạm vào một cuộn để mở.`;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p className="eyebrow">Hũ thư theo mùa</p>
        <h1 className="display h-md">Mỗi mùa, một chiếc hũ.</h1>
      </div>
      <div className="filter-row">
        <div className="chips" role="group" aria-label="Chọn mùa">
          {seasons.map((s) => <button key={s.id} className={s.id === season.id ? 'chip is-on' : 'chip'} aria-pressed={s.id === season.id} onClick={() => setSid(s.id)}>{s.name}</button>)}
        </div>
        <div className="year-pick">
          <label htmlFor="season-year">Năm</label>
          <select id="season-year" className="year-select" value={year} onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">Tất cả các năm</option>
            {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="season-layout">
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <Bottle ribbon={season.ribbon} sealed={st === 'soon'} scrolls={st === 'soon' ? [] : scrolls}
            onOpen={(s) => ctx.openLetter(s, 'season', season.name)} />
        </div>
        <div className="season-info">
          <h2 className="display" style={{ margin: 0, fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 600, lineHeight: 1.15 }}>Hũ thư {season.name}</h2>
          {season.description && <p className="lead">{season.description}</p>}
          {st === 'soon' && <p className="display note-soft">Chưa đến thời gian mở, hãy chờ xíu nhé.</p>}
          {st === 'closed' && <p className="display note-soft">Đã qua dịp này rồi. Hãy cùng đọc lại những lá thư nhé.</p>}
          {st !== 'soon' && <p style={{ margin: 0, fontSize: 15 }}>{countLabel}</p>}
          {st === 'open' && (
            <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="scroll-input" className="label">Thả một cuộn thư vào hũ</label>
              <textarea id="scroll-input" className="lined sheet paper-kem pat-lines scroll-input" rows={4} maxLength={400}
                placeholder="Viết vài dòng cho mùa này…" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={submit} disabled={draft.trim().length < 5}>Cuộn lại &amp; thả vào hũ</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
