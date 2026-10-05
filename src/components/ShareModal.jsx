import { useEffect, useState } from 'react';
import { makeStoryImage, shareImage } from '../lib/storyImage.js';
import { IconClose } from './Icons.jsx';

export default function ShareModal({ letter, replies, onClose, toast }) {
  const hasReplies = replies.length > 0;
  const [mode, setMode] = useState(hasReplies ? 'both' : 'letter');
  const [ri, setRi] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');

  // Vẽ trước ảnh mỗi khi đổi lựa chọn, để lúc bấm nút chia sẻ mở được ngay
  useEffect(() => {
    let alive = true;
    setBlob(null);
    makeStoryImage({ letter, reply: hasReplies ? replies[ri] : null, mode }).then((b) => {
      if (!alive) return;
      setBlob(b);
      setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
    });
    return () => { alive = false; };
  }, [mode, ri]);

  async function share(where) {
    if (!blob) return;
    const r = await shareImage(blob, 'JOMI');
    if (r === 'downloaded') toast(`Đã tải ảnh về máy. Mở ${where}, tạo Story và chọn ảnh vừa lưu nhé.`);
    else if (r === 'shared') toast('Đã mở bảng chia sẻ.');
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Chia sẻ thành ảnh" style={{ zIndex: 60 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viewer" style={{ width: 'min(820px, 100%)' }}>
        <div className="viewer-top">
          <span className="display" style={{ fontStyle: 'italic', fontSize: 19 }}>Chia sẻ thành ảnh</span>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng"><IconClose /></button>
        </div>
        <div className="share-body">
          <div className="story-preview">
            {url ? <img src={url} alt="Ảnh xem trước để đăng Story" /> : <span>Đang vẽ ảnh…</span>}
          </div>
          <div className="share-side">
            <div className="fieldset">
              <span className="label">Nội dung ảnh</span>
              <div className="chips" role="group" aria-label="Nội dung ảnh">
                {[['letter', 'Lá thư'], ['reply', 'Một hồi âm'], ['both', 'Cả hai']].map(([id, label]) => (
                  <button key={id} className={mode === id ? 'chip is-on' : 'chip'} aria-pressed={mode === id} disabled={id !== 'letter' && !hasReplies} onClick={() => setMode(id)}>{label}</button>
                ))}
              </div>
            </div>
            {mode !== 'letter' && hasReplies && (
              <div className="fieldset">
                <span className="label">Chọn 1 hồi âm</span>
                {replies.map((r, i) => (
                  <button key={r.id} className={ri === i ? 'opt is-on' : 'opt'} aria-pressed={ri === i} onClick={() => setRi(i)}><span className="clamp3">{r.body}</span></button>
                ))}
              </div>
            )}
            <div className="fieldset" style={{ marginTop: 'auto' }}>
              <span className="label">Đăng lên</span>
              <div className="grid-2">
                <button className="btn btn-primary" disabled={!blob} onClick={() => share('Instagram')}>Instagram Story</button>
                <button className="btn btn-primary" disabled={!blob} onClick={() => share('TikTok')}>TikTok</button>
              </div>
              <a className="btn btn-ghost" href={url || undefined} download="jomi-story.png">Tải ảnh dọc (9:16)</a>
              <span className="hint-text">Trên điện thoại, bảng chia sẻ sẽ mở ra — chọn Instagram → Story (hoặc TikTok).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
