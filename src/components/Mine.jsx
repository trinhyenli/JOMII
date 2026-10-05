import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useLang } from '../lib/i18n.jsx';
import { IconImage } from './Icons.jsx';
import { LETTER_FIELDS, LetterCard } from './Feed.jsx';
import ShareModal from './ShareModal.jsx';

export default function Mine({ ctx, refreshKey, go }) {
  const { t, f, moodLabel, timeAgo } = useLang();
  const [tab, setTab] = useState('sent');
  const [mine, setMine] = useState(null);
  const [saved, setSaved] = useState([]);
  const [share, setShare] = useState(null);

  useEffect(() => {
    supabase.from('letters').select(`${LETTER_FIELDS}, replies(id, body, created_at)`)
      .eq('kind', 'letter').eq('author_id', ctx.profile.id).neq('status', 'removed')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setMine(data || []));
    supabase.from('saves').select(`created_at, letters(${LETTER_FIELDS})`).eq('user_id', ctx.profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSaved((data || []).map((r) => r.letters).filter(Boolean)));
  }, [refreshKey, ctx.savedIds]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 className="display h-md">{t.mineH1}</h1>
        <p className="lead">{t.mineNote}</p>
      </div>
      <div className="chips" role="group" aria-label={t.sectionAria}>
        <button className={tab === 'sent' ? 'chip is-on' : 'chip'} aria-pressed={tab === 'sent'} onClick={() => setTab('sent')}>{t.sentTab}</button>
        <button className={tab === 'saved' ? 'chip is-on' : 'chip'} aria-pressed={tab === 'saved'} onClick={() => setTab('saved')}>{t.savedTab} ({saved.length})</button>
      </div>

      {tab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {mine && mine.length === 0 && (
            <div className="empty-box"><p>{t.noSent}</p><button className="btn btn-primary" onClick={() => go('write')}>{t.writeFirst}</button></div>
          )}
          {(mine || []).map((l) => {
            const replies = [...(l.replies || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return (
              <article key={l.id} className="panel mine-item">
                <div className={`sheet lined paper-${l.paper} pat-${l.pattern} mine-paper`}><p className="clamp7" style={{ margin: 0 }}>{l.body}</p></div>
                <div className="mine-side">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="tag">{moodLabel(l)}</span>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>{timeAgo(l.created_at)} · {f('hugCount', { n: l.hugs?.[0]?.count ?? 0 })}</span>
                  </div>
                  <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{replies.length ? f('replyCount', { n: replies.length }) : t.noReplies}</h2>
                  {replies.map((r) => (
                    <div key={r.id} className="reply-bubble">
                      <p className="hand" style={{ margin: 0, fontSize: 19, lineHeight: 1.45 }}>{r.body}</p>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.strangerWord} · {timeAgo(r.created_at)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                    <button className="btn btn-primary" onClick={() => setShare({ letter: l, replies })}><IconImage size={17} />{t.shareImage}</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === 'saved' && (
        saved.length
          ? <div className="grid-cards">{saved.map((l) => <LetterCard key={l.id} letter={l} onOpen={() => ctx.openLetter(l, 'saved')} />)}</div>
          : <div className="empty-box"><div className="mini-env" aria-hidden="true" /><p>{t.savedEmpty}</p><button className="btn btn-primary" onClick={() => go('random')}>{t.drawRandom}</button></div>
      )}

      {share && <ShareModal letter={share.letter} replies={share.replies} onClose={() => setShare(null)} toast={ctx.toast} />}
    </section>
  );
}
