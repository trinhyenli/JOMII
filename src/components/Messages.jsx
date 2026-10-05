import { useRef, useState, useEffect } from 'react';
import { supabase, viError } from '../lib/supabase.js';
import { IconSpark, IconPen, Bird } from './Icons.jsx';

export default function Messages({ ctx }) {
  const [stage, setStage] = useState('idle'); // idle | reveal | write | sending
  const [msg, setMsg] = useState(null);
  const [draft, setDraft] = useState('');
  const [sendingText, setSendingText] = useState('');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function reveal() {
    const { data, error } = await supabase.rpc('random_message', { exclude: msg ? msg.id : null });
    if (error) { ctx.toast(viError(error)); return; }
    if (!data || !data.length) { ctx.toast('Chưa có thông điệp nào. Bạn viết thông điệp đầu tiên nhé!'); setStage('write'); return; }
    setStage('blank');
    setMsg(data[0]);
    timers.current.push(setTimeout(() => setStage('reveal'), 60));
  }

  async function send() {
    const body = draft.trim();
    if (body.length < 5) return;
    const { error } = await supabase.from('messages').insert({ body });
    if (error) { ctx.toast(viError(error)); return; }
    setSendingText(body); setDraft(''); setStage('sending');
    timers.current.push(setTimeout(() => {
      setStage('idle'); setSendingText('');
      ctx.toast('Thông điệp đã bay đi. Sau khi được duyệt, một người lạ sẽ mở được nó.');
    }, 3200));
  }

  const lines = draft ? draft.split('\n').length : 0;

  return (
    <section className="msg-section">
      {stage === 'idle' && (
        <>
          <p className="eyebrow">Thông điệp ngẫu nhiên</p>
          <button className="msg-orb" onClick={reveal} aria-label="Mở một thông điệp ngẫu nhiên">
            <span className="orb-ring" aria-hidden="true" /><span className="orb-ring r2" aria-hidden="true" />
            <IconSpark size={34} sw={1.6} />
            <span style={{ display: 'flex', flexDirection: 'column' }}><span>Mở một</span><span>thông điệp</span></span>
          </button>
          <p className="lead" style={{ maxWidth: 440 }}>Vài dòng từ một người lạ — một bài học, một câu triết lý nhỏ, hay một lời động viên.</p>
          <button className="link-plain" onClick={() => setStage('write')}>Hoặc viết một thông điệp</button>
        </>
      )}
      {stage === 'reveal' && msg && (
        <>
          <div className="msg-stage">
            <div className="msg-card msg-pop sheet paper-kem">
              <p className="display msg-text msg-body">{msg.body}</p>
              <div className="msg-text" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--pi)' }}>
                <span>— một người lạ</span><span>Thông điệp #{msg.id}</span>
              </div>
            </div>
          </div>
          <div className="msg-actions">
            <button className="btn btn-primary" onClick={reveal}>Rút thông điệp khác</button>
            <button className="btn btn-ghost" onClick={() => setStage('write')}><IconPen size={17} />Viết thông điệp</button>
          </div>
        </>
      )}
      {stage === 'write' && (
        <div className="panel msg-write">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <label htmlFor="msg-input" className="display" style={{ fontSize: 22, fontWeight: 600 }}>Viết một thông điệp</label>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{lines} / 5 dòng · {draft.length} / 220</span>
          </div>
          <textarea id="msg-input" className="lined sheet paper-kem pat-lines msg-input" rows={5} maxLength={220}
            placeholder="Một điều bạn ước ai đó đã nói với mình…" value={draft}
            onChange={(e) => setDraft(e.target.value.split('\n').slice(0, 5).join('\n'))} />
          <p className="hint-text">Thông điệp sẽ được duyệt trước khi đến với người lạ.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => setStage('idle')}>Huỷ</button>
            <button className="btn btn-primary" onClick={send} disabled={draft.trim().length < 5}>Gửi đi</button>
          </div>
        </div>
      )}
      {stage === 'sending' && (
        <div className="send-stage" role="status" aria-label="Đang gửi thông điệp">
          <div className="carry">
            <Bird />
            <span className="string" />
            <div className="send-paper sheet paper-kem lined pat-lines">{sendingText}</div>
          </div>
          <p className="send-cap">Cuộn lại, buộc dây, và gửi theo cánh chim…</p>
        </div>
      )}
    </section>
  );
}
