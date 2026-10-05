import { useEffect, useRef, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useLang } from '../lib/i18n.jsx';
import { fmtDate } from '../lib/constants.js';
import { IconClose, IconBookmark, IconHeart, IconReply, IconFlip, IconMusic, IconFlag } from './Icons.jsx';

// Lý do lưu vào DB bằng tiếng Việt để admin đọc; hiển thị theo ngôn ngữ đang chọn
const REASONS = [['Ngôn từ xúc phạm', 'rAbuse'], ['Spam / quảng cáo', 'rSpam'], ['Lộ thông tin cá nhân', 'rPrivate'], ['Nội dung không phù hợp', 'rInappropriate']];

/**
 * source: 'feed' | 'random' | 'season' | 'saved' | 'future' | 'mine'
 */
export default function Viewer({ letter, source, seasonName, ctx, onClose, onNext }) {
  const { profile, toast, savedIds, toggleSave } = ctx;
  const { t, f, moodLabel, timeAgo } = useLang();
  const [phase, setPhase] = useState('opening');
  const [flipped, setFlipped] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [replied, setReplied] = useState(false);
  const [hugged, setHugged] = useState(false);
  const [hugs, setHugs] = useState(letter.hugs?.[0]?.count ?? 0);
  const [burst, setBurst] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const timers = useRef([]);

  const isScroll = source === 'season';
  const isFuture = letter.kind === 'future';
  const isMine = letter.author_id === profile.id;
  const canInteract = !isFuture && !isMine;
  const saved = savedIds.has(letter.id);

  useEffect(() => {
    setPhase('opening'); setFlipped(false); setDraft(''); setReplied(false); setReportOpen(false);
    setHugs(letter.hugs?.[0]?.count ?? 0);
    timers.current.push(setTimeout(() => setPhase('read'), isScroll ? 1700 : 2050));
    if (!isFuture) {
      supabase.from('hugs').select('letter_id').eq('letter_id', letter.id).eq('user_id', profile.id)
        .then(({ data }) => setHugged(!!(data && data.length)));
      supabase.from('hugs').select('*', { count: 'exact', head: true }).eq('letter_id', letter.id)
        .then(({ count }) => typeof count === 'number' && setHugs(count));
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { timers.current.forEach(clearTimeout); timers.current = []; window.removeEventListener('keydown', onKey); };
  }, [letter.id]);

  async function toggleHug() {
    if (hugged) {
      setHugged(false); setHugs((h) => Math.max(0, h - 1));
      await supabase.from('hugs').delete().eq('letter_id', letter.id).eq('user_id', profile.id);
    } else {
      setHugged(true); setHugs((h) => h + 1); setBurst(true);
      timers.current.push(setTimeout(() => setBurst(false), 1100));
      const { error } = await supabase.from('hugs').insert({ letter_id: letter.id });
      if (error) { setHugged(false); setHugs((h) => h - 1); toast(errText(error, t)); }
    }
  }

  async function sendReply() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from('replies').insert({ letter_id: letter.id, body });
    setSending(false);
    if (error) { toast(errText(error, t)); return; }
    setDraft(''); setFlipped(false); setReplied(true);
    toast(t.tReplied);
  }

  async function report(reason) {
    setReportOpen(false);
    const { error } = await supabase.from('reports').insert({ target_type: 'letter', target_id: letter.id, reason });
    toast(error ? errText(error, t) : t.tReported);
  }

  const paperCls = `paper-${letter.paper}`;
  const caption = source === 'random' ? t.readRandom
    : isScroll ? f('readScroll', { name: seasonName || '' })
    : isFuture ? f('fromYouOn', { d: fmtDate(letter.created_at) })
    : isMine ? t.yourLetter : t.readPublic;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t.letterWord} onClick={(e) => { if (e.target === e.currentTarget && phase === 'read') onClose(); }}>
      {phase === 'opening' && !isScroll && (
        <div className="stage">
          <div className="env">
            <div className="env-back" />
            <div className={`env-letter sheet hand ${paperCls}`}>{letter.body}</div>
            <div className="env-front" />
            <div className="env-flap" />
            <div className="env-seal" />
          </div>
          <p className="stage-cap">{source === 'random' ? t.capRandom : isFuture ? t.capFuture : t.capOpening}</p>
        </div>
      )}
      {phase === 'opening' && isScroll && (
        <div className="stage stage-scroll">
          <div className="unroll"><div className="rod" /><div className="unroll-paper">{letter.body}</div><div className="rod" /></div>
          <p className="stage-cap">{t.openingScroll}</p>
        </div>
      )}

      {phase === 'read' && (
        <div className="viewer">
          <div className="viewer-top">
            <span className="display" style={{ fontStyle: 'italic', fontSize: 17 }}>{caption}</span>
            <button className="icon-btn" onClick={onClose} aria-label={t.closeLetter}><IconClose /></button>
          </div>
          <div className={flipped ? 'flip is-flipped' : 'flip'}>
            <div className="flip-inner">
              <div className={`face sheet ${paperCls}`} aria-hidden={flipped}>
                <div className="face-head">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
                      <span className="ptag">{moodLabel(letter)}</span>
                      <span style={{ opacity: 0.75 }}>{timeAgo(letter.created_at)}</span>
                    </div>
                    {letter.song && (
                      <span className="song"><span className="music-ic"><IconMusic size={14} sw={2.2} /></span>
                        <span>{t.songWriter} <strong>{letter.song}</strong></span></span>
                    )}
                  </div>
                  <span className={`stamp stamp-lg stamp-${letter.stamp}`} aria-hidden="true"><i /></span>
                </div>
                <div className={`face-body lined pat-${letter.pattern}`}>
                  <p style={{ margin: 0 }}>{isFuture ? t.greetFuture : t.greetStranger}</p>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{letter.body}</p>
                  <p style={{ margin: '36px 0 0', textAlign: 'right' }}>— {letter.sign || (isFuture ? t.yourself : t.aStrangerCap)}</p>
                </div>
                <div className="face-foot">
                  {burst && [1, 2, 3].map((n) => <span key={n} className={`burst b${n}`}><IconHeart filled size={18 + n * 2} /></span>)}
                  {canInteract && (
                    <>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
                        <button className={saved ? 'btn pbtn is-on' : 'btn pbtn'} onClick={() => toggleSave(letter)} aria-pressed={saved} style={{ height: 44, padding: '0 16px' }}>
                          <IconBookmark size={17} />{saved ? t.kept : t.keep}</button>
                        <button className="btn pbtn" onClick={() => setReportOpen(!reportOpen)} aria-expanded={reportOpen} aria-label={t.reportAria} style={{ height: 44, padding: '0 14px' }}><IconFlag size={17} /></button>
                        {reportOpen && (
                          <div className="report-menu" role="menu">
                            <span className="lbl" style={{ padding: '4px 8px' }}>{t.reportBecause}</span>
                            {REASONS.map(([r, k]) => <button key={r} role="menuitem" onClick={() => report(r)}>{t[k]}</button>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {replied && <span style={{ fontSize: 13, opacity: 0.75 }}>{t.youReplied}</span>}
                        <button className={hugged ? 'btn pbtn is-on' : 'btn pbtn'} onClick={toggleHug} aria-pressed={hugged}>
                          <IconHeart filled={hugged} />{hugged ? t.hugged : t.hugYou} · {hugs}</button>
                        <button className="btn btn-primary" onClick={() => setFlipped(true)}><IconReply size={17} />{t.sendReply}</button>
                      </div>
                    </>
                  )}
                  {isMine && !isFuture && (
                    <>
                      <span style={{ fontSize: 14, opacity: 0.8 }}>{f('mineView', { n: hugs })}</span>
                      {ctx.goMine && <button className="btn btn-primary" onClick={() => { onClose(); ctx.goMine(); }}>{t.viewReplies}</button>}
                    </>
                  )}
                  {isFuture && (
                    <>
                      <span style={{ fontSize: 14, opacity: 0.8 }}>{t.futureOnlyYou}</span>
                      <button className="btn btn-primary" onClick={onClose}>{t.foldLetter}</button>
                    </>
                  )}
                  {onNext && <button className="btn pbtn" onClick={onNext} style={{ width: '100%' }}>{t.nextLetter}</button>}
                </div>
              </div>

              <div className={`face face-back sheet ${paperCls}`} aria-hidden={!flipped}>
                <div className="face-head">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="display" style={{ fontSize: 22, fontWeight: 600 }}>{t.backSide}</span>
                    <span style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.5 }}>{t.backNote}</span>
                  </div>
                  <span className={`stamp stamp-lg stamp-${letter.stamp}`} aria-hidden="true" style={{ transform: 'rotate(-6deg)', opacity: 0.5 }}><i /></span>
                </div>
                <label htmlFor="reply-area" className="sr">{t.writeReply}</label>
                <textarea id="reply-area" className={`reply-area lined pat-${letter.pattern}`} maxLength={800} placeholder={t.replyPh}
                  value={draft} onChange={(e) => setDraft(e.target.value)} tabIndex={flipped ? 0 : -1} />
                <div className="face-foot">
                  <button className="btn pbtn" onClick={() => setFlipped(false)} tabIndex={flipped ? 0 : -1}><IconFlip size={17} />{t.flipFront}</button>
                  <button className="btn btn-primary" onClick={sendReply} disabled={!draft.trim() || sending} tabIndex={flipped ? 0 : -1}>{sending ? t.sending : t.sendReply}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
