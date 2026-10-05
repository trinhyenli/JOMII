import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { moodLabel, timeAgo } from '../lib/constants.js';
import { IconImage } from './Icons.jsx';
import { LETTER_FIELDS, LetterCard } from './Feed.jsx';
import ShareModal from './ShareModal.jsx';

export default function Mine({ ctx, refreshKey, go }) {
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
        <h1 className="display h-md">Hộp thư của bạn</h1>
        <p className="lead">Hồi âm cho thư của bạn chỉ hiện ở đây — không ai khác đọc được.</p>
      </div>
      <div className="chips" role="group" aria-label="Mục">
        <button className={tab === 'sent' ? 'chip is-on' : 'chip'} aria-pressed={tab === 'sent'} onClick={() => setTab('sent')}>Thư bạn đã gửi</button>
        <button className={tab === 'saved' ? 'chip is-on' : 'chip'} aria-pressed={tab === 'saved'} onClick={() => setTab('saved')}>Đã giữ lại ({saved.length})</button>
      </div>

      {tab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {mine && mine.length === 0 && (
            <div className="empty-box"><p>Bạn chưa gửi lá thư nào.</p><button className="btn btn-primary" onClick={() => go('write')}>Viết lá thư đầu tiên</button></div>
          )}
          {(mine || []).map((l) => {
            const replies = [...(l.replies || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return (
              <article key={l.id} className="panel mine-item">
                <div className={`sheet lined paper-${l.paper} pat-${l.pattern} mine-paper`}><p className="clamp7" style={{ margin: 0 }}>{l.body}</p></div>
                <div className="mine-side">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="tag">{moodLabel(l)}</span>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>{timeAgo(l.created_at)} · {l.hugs?.[0]?.count ?? 0} cái ôm</span>
                  </div>
                  <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{replies.length ? `${replies.length} hồi âm cho bạn` : 'Chưa có hồi âm'}</h2>
                  {replies.map((r) => (
                    <div key={r.id} className="reply-bubble">
                      <p className="hand" style={{ margin: 0, fontSize: 19, lineHeight: 1.45 }}>{r.body}</p>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Người lạ · {timeAgo(r.created_at)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                    <button className="btn btn-primary" onClick={() => setShare({ letter: l, replies })}><IconImage size={17} />Chia sẻ thành ảnh</button>
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
          : <div className="empty-box"><div className="mini-env" aria-hidden="true" /><p>Chưa có lá thư nào. Khi đọc thư, bấm “Giữ lại” để lưu vào đây.</p><button className="btn btn-primary" onClick={() => go('random')}>Rút thư ngẫu nhiên</button></div>
      )}

      {share && <ShareModal letter={share.letter} replies={share.replies} onClose={() => setShare(null)} toast={ctx.toast} />}
    </section>
  );
}
