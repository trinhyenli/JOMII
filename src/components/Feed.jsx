import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { MOODS, PER_PAGE, yearOptions, yearRange, seasonStatus } from '../lib/constants.js';
import { useLang } from '../lib/i18n.jsx';
import { IconArrow } from './Icons.jsx';

export const LETTER_FIELDS = 'id, author_id, kind, season_id, mood, mood_custom, sign, body, paper, pattern, stamp, song, open_at, created_at, hugs(count)';

export function LetterCard({ letter, onOpen, mine }) {
  const { t, f, moodLabel, timeAgo } = useLang();
  const hugs = letter.hugs?.[0]?.count ?? 0;
  return (
    <button className="card-env" onClick={onOpen} aria-label={`${t.openLetter} — ${moodLabel(letter)}`}>
      <div className="card-flap"><span className="card-seal" /><span className={`stamp stamp-sm stamp-${letter.stamp}`} style={{ position: 'absolute', right: 14, top: 12, zIndex: 3 }}><i /></span></div>
      <div className="card-body">
        <div className="card-meta">
          <span className="tag">{mine ? t.yourLetter : moodLabel(letter)}</span>
          <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{timeAgo(letter.created_at)}</span>
        </div>
        <p className="hand clamp4 card-text">{letter.body}</p>
        <div className="card-foot">
          <span className="ellipsis">— {letter.sign || t.anonymous}</span>
          <span style={{ whiteSpace: 'nowrap' }}>{f('hugCount', { n: hugs })}</span>
        </div>
      </div>
    </button>
  );
}

export function Pager({ page, pages, onPage }) {
  const { t } = useLang();
  if (pages <= 1) return null;
  const list = [];
  for (let n = 1; n <= pages; n++) {
    if (pages > 7 && n !== 1 && n !== pages && Math.abs(n - page) > 1) {
      if (list[list.length - 1] !== '…') list.push('…');
      continue;
    }
    list.push(n);
  }
  return (
    <nav aria-label={t.pagination} className="pager">
      <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label={t.prevPage}><IconArrow dir="left" /></button>
      {list.map((n, i) => n === '…'
        ? <span key={`g${i}`} style={{ color: 'var(--muted)' }}>…</span>
        : <button key={n} className={n === page ? 'page-btn is-on' : 'page-btn'} onClick={() => onPage(n)} aria-label={`${t.pageWord} ${n}`} aria-current={n === page ? 'page' : undefined}>{n}</button>)}
      <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === pages} aria-label={t.nextPage}><IconArrow /></button>
    </nav>
  );
}

export default function Feed({ ctx, go, refreshKey }) {
  const { t, f, moodName } = useLang();
  const { profile, openLetter } = ctx;
  const [mood, setMood] = useState('all');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [openSeason, setOpenSeason] = useState(null);
  const [arrived, setArrived] = useState(0);

  useEffect(() => {
    let q = supabase.from('letters').select(LETTER_FIELDS, { count: 'exact' })
      .eq('kind', 'letter').eq('status', 'visible')
      .order('created_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
    if (mood !== 'all') q = q.eq('mood', mood);
    if (year !== 'all') { const [a, b] = yearRange(year); q = q.gte('created_at', a).lt('created_at', b); }
    setRows(null);
    q.then(({ data, count }) => { setRows(data || []); setTotal(count || 0); });
  }, [mood, year, page, refreshKey]);

  useEffect(() => {
    supabase.from('seasons').select('*').order('open_date').then(({ data }) => {
      setOpenSeason((data || []).find((s) => seasonStatus(s) === 'open') || null);
    });
    supabase.from('letters').select('id', { count: 'exact', head: true })
      .eq('kind', 'future').eq('author_id', profile.id).lte('open_at', new Date().toISOString())
      .then(({ count }) => setArrived(count || 0));
  }, [refreshKey]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <section className="hero">
        <div style={{ maxWidth: 660 }}>
          <p className="eyebrow">{t.publicBox}</p>
          <h1 className="display h-xl">{t.homeH1}</h1>
        </div>
        <div className="row-gap">
          <button className="btn btn-primary" onClick={() => go('write')}>{t.writeLetterBtn}</button>
          <button className="btn btn-ghost" onClick={() => go('random')}>{t.drawRandom}</button>
        </div>
      </section>

      {(openSeason || arrived > 0) && (
        <div className="banners">
          {openSeason && (
            <div className="panel banner">
              <div className="mini-jar" aria-hidden="true" />
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <p className="eyebrow sm">{t.seasonJar}</p>
                <p style={{ margin: '4px 0 0', fontSize: 15, lineHeight: 1.45 }}>{openSeason.name} — {openSeason.description}</p>
              </div>
              <button className="btn btn-ghost sm" onClick={() => go('season', openSeason.id)}>{t.visitJar}</button>
            </div>
          )}
          {arrived > 0 && (
            <div className="panel banner">
              <span className="stamp stamp-sm stamp-may" aria-hidden="true"><i /></span>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <p className="eyebrow sm">{t.future}</p>
                <p style={{ margin: '4px 0 0', fontSize: 15, lineHeight: 1.45 }}>{t.futureArrived}</p>
              </div>
              <button className="btn btn-ghost sm" onClick={() => go('future')}>{t.openMail}</button>
            </div>
          )}
        </div>
      )}

      <div className="filters">
        <div className="filter-row">
          <div className="chips" role="group" aria-label={t.filterMood}>
            {['all', ...MOODS].map((m) => (
              <button key={m} className={mood === m ? 'chip is-on' : 'chip'} aria-pressed={mood === m} onClick={() => { setMood(m); setPage(1); }}>{m === 'all' ? t.all : moodName(m)}</button>
            ))}
          </div>
          <div className="year-pick">
            <label htmlFor="feed-year">{t.year}</label>
            <select id="feed-year" className="year-select" value={year} onChange={(e) => { setYear(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1); }}>
              <option value="all">{t.allYears}</option>
              {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{rows ? f('feedCount', { n: total, p: page, c: pages }) : t.loading}</span>
      </div>

      <div className="grid-cards">
        {(rows || []).map((l) => <LetterCard key={l.id} letter={l} mine={l.author_id === profile.id} onOpen={() => openLetter(l, 'feed')} />)}
      </div>
      {rows && rows.length === 0 && <p className="empty">{t.feedEmpty}</p>}
      <Pager page={page} pages={pages} onPage={setPage} />
    </>
  );
}
