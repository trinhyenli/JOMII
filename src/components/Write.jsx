import { useState } from 'react';
import { supabase, viError } from '../lib/supabase.js';
import { MOODS, PAPERS, PATTERNS, STAMPS } from '../lib/constants.js';

export default function Write({ ctx, onDone }) {
  const [body, setBody] = useState('');
  const [mood, setMood] = useState('Tâm sự');
  const [moodCustom, setMoodCustom] = useState('');
  const [paper, setPaper] = useState('kem');
  const [pattern, setPattern] = useState('lines');
  const [stamp, setStamp] = useState('hoa');
  const [song, setSong] = useState('');
  const [sign, setSign] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (body.trim().length < 5) return;
    setBusy(true);
    const { error } = await supabase.from('letters').insert({
      kind: 'letter', body: body.trim(), mood, mood_custom: mood === 'Khác' ? moodCustom.trim() : '',
      paper, pattern, stamp, song: song.trim(), sign: sign.trim(),
    });
    setBusy(false);
    if (error) { ctx.toast(viError(error)); return; }
    ctx.toast('Lá thư đã bay vào Hòm thư chung.');
    onDone();
  }

  return (
    <section className="two-col">
      <div className="col-main">
        <div>
          <h1 className="display h-md">Gửi một người lạ,</h1>
          <p className="lead" style={{ marginTop: 10 }}>Lá thư sẽ nằm trong Hòm thư chung. Ai cũng có thể đọc, rút ngẫu nhiên, gửi bạn một cái ôm hoặc hồi âm. Không ai biết bạn là ai.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <label htmlFor="letter-body" className="sr">Nội dung lá thư</label>
          <textarea id="letter-body" className={`write-area lined sheet paper-${paper} pat-${pattern}`} maxLength={2000}
            placeholder="Hôm nay mình muốn kể…" value={body} onChange={(e) => setBody(e.target.value)} style={{ height: 612 }} />
          <span className={`stamp stamp-lg stamp-${stamp}`} style={{ position: 'absolute', top: 20, right: 22, pointerEvents: 'none' }} aria-hidden="true"><i /></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span>{song.trim() ? `Bài hát gửi kèm: ${song.trim()}` : 'Chưa ghi bài hát nào'}</span>
          <span>{body.length} / 2000</span>
        </div>
      </div>

      <aside className="panel col-side">
        <div className="fieldset">
          <span className="label">Tâm trạng</span>
          <div className="chips">
            {MOODS.map((m) => <button key={m} className={mood === m ? 'chip is-on' : 'chip'} aria-pressed={mood === m} onClick={() => setMood(m)}>{m}</button>)}
          </div>
          {mood === 'Khác' && (
            <>
              <label htmlFor="mood-custom" className="sr">Gọi tên cảm xúc</label>
              <input id="mood-custom" className="field" type="text" maxLength={24} placeholder="Gọi tên nếu bạn muốn (không bắt buộc)" value={moodCustom} onChange={(e) => setMoodCustom(e.target.value)} />
            </>
          )}
        </div>
        <div className="fieldset">
          <span className="label">Màu giấy</span>
          <div className="chips">
            {PAPERS.map(([id, label]) => <button key={id} className={`paper-sw paper-${id}${paper === id ? ' is-on' : ''}`} aria-label={`Giấy ${label}`} title={label} aria-pressed={paper === id} onClick={() => setPaper(id)} />)}
          </div>
        </div>
        <div className="fieldset">
          <span className="label">Hoa văn giấy</span>
          <div className="chips">
            {PATTERNS.map(([id, label]) => <button key={id} className={pattern === id ? 'chip is-on' : 'chip'} aria-pressed={pattern === id} onClick={() => setPattern(id)}>{label}</button>)}
          </div>
        </div>
        <div className="fieldset">
          <span className="label">Tem đính</span>
          <div className="grid-5">
            {STAMPS.map(([id, label]) => (
              <button key={id} className={stamp === id ? 'stamp-opt is-on' : 'stamp-opt'} aria-pressed={stamp === id} onClick={() => setStamp(id)}>
                <span className={`stamp stamp-sm stamp-${id}`} aria-hidden="true"><i /></span>{label}
              </button>
            ))}
          </div>
        </div>
        <div className="fieldset">
          <label htmlFor="song" className="label">Bài hát bạn đang nghe (tuỳ chọn)</label>
          <input id="song" className="field" type="text" maxLength={80} placeholder="Tên bài hát – Ca sĩ" value={song} onChange={(e) => setSong(e.target.value)} />
          <span className="hint-text">Chỉ ghi tên bài hát, người đọc sẽ tự tìm nghe.</span>
        </div>
        <div className="fieldset">
          <label htmlFor="sign" className="label">Ký tên (tuỳ chọn)</label>
          <input id="sign" className="field" type="text" maxLength={40} placeholder="Ví dụ: Một đứa hay thức khuya" value={sign} onChange={(e) => setSign(e.target.value)} />
        </div>
        <button className="btn btn-primary wide" onClick={submit} disabled={body.trim().length < 5 || busy}>{busy ? 'Đang gửi…' : 'Gửi lá thư đi'}</button>
      </aside>
    </section>
  );
}
