import { useRef, useState, useEffect } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useLang } from '../lib/i18n.jsx';
import { HugLogo, IconPen, Bird } from './Icons.jsx';

const N_PAGES = 6;
const BOOK_MS = 2000;

function Book({ stage, msg, onOpen }) {
  const { t } = useLang();
  const open = stage === 'opening' || stage === 'open';
  const coverDelay = open ? 0.15 : 0.75;
  return (
    <div className="book-stage">
      <div className={stage === 'closed' ? 'book-float is-floating' : 'book-float'}>
        <div className={open ? 'book is-open' : 'book'}>
          <div className="page-r">
            <div className="page-r-in">
              <p className="display book-msg">{msg ? msg.body : ''}</p>
              <div className="book-sign"><span>— {t.aStranger}</span><span>{msg ? `${t.msgNo}${msg.id}` : ''}</span></div>
            </div>
          </div>
          {Array.from({ length: N_PAGES }, (_, i) => {
            const d = open ? 0.55 + i * 0.15 : (N_PAGES - 1 - i) * 0.1;
            return (
              <div key={i} className="fpage" style={{ transitionDelay: `${d}s, ${d + 0.3}s`, zIndex: open ? 2 + i : 20 - i }}>
                <div className="fp-face fp-front" />
                <div className="fp-face fp-back">
                  {i === N_PAGES - 1 && msg && (
                    <div className="left-content">
                      <HugLogo size={40} />
                      <span className="display left-no">{t.msgNo}{msg.id}</span>
                      <span className="left-note">{t.bookLeft}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="cover" style={{ transitionDelay: `${coverDelay}s, ${coverDelay + 0.45}s`, zIndex: open ? 1 : 30 }}>
            <div className="cover-face cover-front">
              <span className="cover-band" aria-hidden="true" />
              <div className="cover-frame">
                <HugLogo className="cover-icon" heart="currentColor" />
                <span className="display cover-title">{t.book}</span>
                <span className="cover-sub">JOMI</span>
              </div>
            </div>
            <div className="cover-face cover-back" />
          </div>
          {stage === 'closed' && <button className="book-hit" onClick={onOpen} aria-label={t.openBook} />}
        </div>
      </div>
      <span className={stage === 'closed' ? 'book-shadow is-floating' : open ? 'book-shadow is-open' : 'book-shadow'} aria-hidden="true" />
    </div>
  );
}

export default function Messages({ ctx }) {
  const { t } = useLang();
  const [stage, setStage] = useState('closed'); // closed | opening | open | closing | write | sending
  const [msg, setMsg] = useState(null);
  const [draft, setDraft] = useState('');
  const [sendingText, setSendingText] = useState('');
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function fetchMessage(exclude) {
    const { data, error } = await supabase.rpc('random_message', { exclude: exclude || null });
    if (error) { ctx.toast(errText(error, t)); return null; }
    if (!data || !data.length) { ctx.toast(t.bookEmpty); return null; }
    return data[0];
  }

  async function openBook() {
    if (stage !== 'closed') return;
    const m = await fetchMessage(msg && msg.id);
    if (!m) return;
    setMsg(m); setStage('opening');
    later(() => setStage('open'), BOOK_MS);
  }

  async function another() {
    if (stage !== 'open') return;
    setStage('closing');
    const next = fetchMessage(msg && msg.id);
    later(async () => {
      const m = await next;
      if (!m) { setStage('closed'); return; }
      setMsg(m); setStage('opening');
      later(() => setStage('open'), BOOK_MS);
    }, BOOK_MS);
  }

  async function send() {
    const body = draft.trim();
    if (body.length < 5) return;
    const { error } = await supabase.from('messages').insert({ body });
    if (error) { ctx.toast(errText(error, t)); return; }
    setSendingText(body); setDraft(''); setStage('sending');
    later(() => {
      setStage('closed'); setSendingText('');
      ctx.toast(t.tMsgQueued);
    }, 3200);
  }

  const lines = draft ? draft.split('\n').length : 0;
  const showBook = ['closed', 'opening', 'open', 'closing'].includes(stage);
  const writeBtn = <button className="btn btn-ghost" onClick={() => setStage('write')}><IconPen size={17} />{t.writeMsg}</button>;

  return (
    <section className="msg-section">
      {showBook && (
        <>
          <p className="eyebrow" style={{ margin: 0 }}>{t.book}</p>
          <Book stage={stage} msg={msg} onOpen={openBook} />
          {stage === 'closed' && (
            <>
              <p className="lead" style={{ maxWidth: 440 }}>{t.bookHint}</p>
              {writeBtn}
            </>
          )}
          {stage === 'open' && (
            <div className="msg-actions">
              <button className="btn btn-primary" onClick={another}>{t.anotherMsg}</button>
              {writeBtn}
            </div>
          )}
          {(stage === 'opening' || stage === 'closing') && (
            <p className="display" style={{ margin: 0, fontStyle: 'italic', color: 'var(--muted)', minHeight: 48 }}>
              {stage === 'closing' ? t.busyClosing : t.busyOpening}
            </p>
          )}
        </>
      )}
      {stage === 'write' && (
        <div className="panel msg-write">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <label htmlFor="msg-input" className="display" style={{ fontSize: 22, fontWeight: 600 }}>{t.writeMsgH}</label>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{lines} / 5 {t.linesWord} · {draft.length} / 220</span>
          </div>
          <textarea id="msg-input" className="lined sheet paper-kem pat-lines msg-input" rows={5} maxLength={220}
            placeholder={t.msgPh} value={draft}
            onChange={(e) => setDraft(e.target.value.split('\n').slice(0, 5).join('\n'))} />
          <p className="hint-text">{t.msgReview}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => setStage('closed')}>{t.cancel}</button>
            <button className="btn btn-primary" onClick={send} disabled={draft.trim().length < 5}>{t.send}</button>
          </div>
        </div>
      )}
      {stage === 'sending' && (
        <div className="send-stage" role="status" aria-label={t.sendingAria}>
          <div className="carry">
            <Bird />
            <span className="string" />
            <div className="send-paper sheet paper-kem lined pat-lines">{sendingText}</div>
          </div>
          <p className="send-cap">{t.birdCap}</p>
        </div>
      )}
    </section>
  );
}
