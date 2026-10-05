import { useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useLang } from '../lib/i18n.jsx';

const PAPER_KEYS = { kem: 'pKem', hong: 'pHong', xanh: 'pXanh', bacha: 'pBacha', tim: 'pTim', dem: 'pDem' };
const PATTERN_KEYS = { lines: 'patLines', grid: 'patGrid', dots: 'patDots', plain: 'patPlain' };
const STAMP_KEYS = { hoa: 'stHoa', trang: 'stTrang', song: 'stSong', nui: 'stNui', may: 'stMay' };
import { MOODS, PAPERS, PATTERNS, STAMPS } from '../lib/constants.js';

export default function Write({ ctx, onDone }) {
  const { t, f, moodName } = useLang();
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
    if (error) { ctx.toast(errText(error, t)); return; }
    ctx.toast(t.tLetterSent);
    onDone();
  }

  return (
    <section className="two-col">
      <div className="col-main">
        <div>
          <h1 className="display h-md">{t.toStrangerH}</h1>
          <p className="lead" style={{ marginTop: 10 }}>{t.writeLead}</p>
        </div>
        <div style={{ position: 'relative' }}>
          <label htmlFor="letter-body" className="sr">{t.letterContent}</label>
          <textarea id="letter-body" className={`write-area lined sheet paper-${paper} pat-${pattern}`} maxLength={2000}
            placeholder={t.letterPh} value={body} onChange={(e) => setBody(e.target.value)} style={{ height: 612 }} />
          <span className={`stamp stamp-lg stamp-${stamp}`} style={{ position: 'absolute', top: 20, right: 22, pointerEvents: 'none' }} aria-hidden="true"><i /></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span>{song.trim() ? f('songAttached', { s: song.trim() }) : t.noSong}</span>
          <span>{body.length} / 2000</span>
        </div>
      </div>

      <aside className="panel col-side">
        <div className="fieldset">
          <span className="label">{t.mood}</span>
          <div className="chips">
            {MOODS.map((m) => <button key={m} className={mood === m ? 'chip is-on' : 'chip'} aria-pressed={mood === m} onClick={() => setMood(m)}>{moodName(m)}</button>)}
          </div>
          {mood === 'Khác' && (
            <>
              <label htmlFor="mood-custom" className="sr">{t.nameFeeling}</label>
              <input id="mood-custom" className="field" type="text" maxLength={24} placeholder={t.nameFeelingPh} value={moodCustom} onChange={(e) => setMoodCustom(e.target.value)} />
            </>
          )}
        </div>
        <div className="fieldset">
          <span className="label">{t.paperColor}</span>
          <div className="chips">
            {PAPERS.map(([id, label]) => <button key={id} className={`paper-sw paper-${id}${paper === id ? ' is-on' : ''}`} aria-label={`${t.paperAria} ${t[PAPER_KEYS[id]]}`} title={t[PAPER_KEYS[id]]} aria-pressed={paper === id} onClick={() => setPaper(id)} />)}
          </div>
        </div>
        <div className="fieldset">
          <span className="label">{t.pattern}</span>
          <div className="chips">
            {PATTERNS.map(([id, label]) => <button key={id} className={pattern === id ? 'chip is-on' : 'chip'} aria-pressed={pattern === id} onClick={() => setPattern(id)}>{t[PATTERN_KEYS[id]]}</button>)}
          </div>
        </div>
        <div className="fieldset">
          <span className="label">{t.stamp}</span>
          <div className="grid-5">
            {STAMPS.map(([id, label]) => (
              <button key={id} className={stamp === id ? 'stamp-opt is-on' : 'stamp-opt'} aria-pressed={stamp === id} onClick={() => setStamp(id)}>
                <span className={`stamp stamp-sm stamp-${id}`} aria-hidden="true"><i /></span>{t[STAMP_KEYS[id]]}
              </button>
            ))}
          </div>
        </div>
        <div className="fieldset">
          <label htmlFor="song" className="label">{t.songListening}</label>
          <input id="song" className="field" type="text" maxLength={80} placeholder={t.songPh} value={song} onChange={(e) => setSong(e.target.value)} />
          <span className="hint-text">{t.songHint}</span>
        </div>
        <div className="fieldset">
          <label htmlFor="sign" className="label">{t.signLbl}</label>
          <input id="sign" className="field" type="text" maxLength={40} placeholder={t.signPh} value={sign} onChange={(e) => setSign(e.target.value)} />
        </div>
        <button className="btn btn-primary wide" onClick={submit} disabled={body.trim().length < 5 || busy}>{busy ? t.sending : t.sendLetter}</button>
      </aside>
    </section>
  );
}
