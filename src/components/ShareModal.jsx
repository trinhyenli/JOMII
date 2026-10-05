import { useEffect, useState } from 'react';
import { makeStoryImage, shareImage } from '../lib/storyImage.js';
import { IconClose } from './Icons.jsx';
import { useLang } from '../lib/i18n.jsx';

export default function ShareModal({ letter, replies, onClose, toast }) {
  const { t, f, lang } = useLang();
  const hasReplies = replies.length > 0;
  const [mode, setMode] = useState(hasReplies ? 'both' : 'letter');
  const [ri, setRi] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');

  // Vẽ trước ảnh mỗi khi đổi lựa chọn, để lúc bấm nút chia sẻ mở được ngay
  useEffect(() => {
    let alive = true;
    setBlob(null);
    makeStoryImage({ letter, reply: hasReplies ? replies[ri] : null, mode, labels: { dear: t.dearStranger, stranger: t.aStranger, replyFrom: t.replyFrom } }).then((b) => {
      if (!alive) return;
      setBlob(b);
      setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
    });
    return () => { alive = false; };
  }, [mode, ri, lang]);

  async function share(where) {
    if (!blob) return;
    const r = await shareImage(blob, 'JOMI');
    if (r === 'downloaded') toast(f('tDownloaded', { app: where }));
    else if (r === 'shared') toast(t.tShared);
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t.shareImage} style={{ zIndex: 60 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viewer" style={{ width: 'min(820px, 100%)' }}>
        <div className="viewer-top">
          <span className="display" style={{ fontStyle: 'italic', fontSize: 19 }}>{t.shareImage}</span>
          <button className="icon-btn" onClick={onClose} aria-label={t.close}><IconClose /></button>
        </div>
        <div className="share-body">
          <div className="story-preview">
            {url ? <img src={url} alt={t.previewAlt} /> : <span>{t.drawingImage}</span>}
          </div>
          <div className="share-side">
            <div className="fieldset">
              <span className="label">{t.imageContent}</span>
              <div className="chips" role="group" aria-label={t.imageContent}>
                {[['letter', t.letterWord], ['reply', t.oneReply], ['both', t.both]].map(([id, label]) => (
                  <button key={id} className={mode === id ? 'chip is-on' : 'chip'} aria-pressed={mode === id} disabled={id !== 'letter' && !hasReplies} onClick={() => setMode(id)}>{label}</button>
                ))}
              </div>
            </div>
            {mode !== 'letter' && hasReplies && (
              <div className="fieldset">
                <span className="label">{t.pickReply}</span>
                {replies.map((r, i) => (
                  <button key={r.id} className={ri === i ? 'opt is-on' : 'opt'} aria-pressed={ri === i} onClick={() => setRi(i)}><span className="clamp3">{r.body}</span></button>
                ))}
              </div>
            )}
            <div className="fieldset" style={{ marginTop: 'auto' }}>
              <span className="label">{t.postTo}</span>
              <div className="grid-2">
                <button className="btn btn-primary" disabled={!blob} onClick={() => share('Instagram')}>Instagram Story</button>
                <button className="btn btn-primary" disabled={!blob} onClick={() => share('TikTok')}>TikTok</button>
              </div>
              <a className="btn btn-ghost" href={url || undefined} download="jomi-story.png">{t.download}</a>
              <span className="hint-text">{t.shareHint}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
