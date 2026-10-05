// Vẽ ảnh dọc 1080 × 1920 (đúng khung Instagram/TikTok Story) ngay trong trình duyệt.

const PAPER = {
  kem: ['#FFF8EC', '#33261C', 'rgba(120,80,40,.18)'],
  hong: ['#FFEAF0', '#3A1622', 'rgba(190,60,100,.17)'],
  xanh: ['#E9F3FF', '#14284A', 'rgba(40,90,170,.16)'],
  bacha: ['#E8F6EE', '#12301F', 'rgba(30,120,80,.17)'],
  tim: ['#F1EBFB', '#2A1F45', 'rgba(100,70,170,.16)'],
  dem: ['#1F1D28', '#EEE9F6', 'rgba(255,255,255,.13)'],
};

function wrap(ctx, text, maxWidth) {
  const lines = [];
  String(text).split('\n').forEach((para) => {
    let line = '';
    para.split(' ').forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    });
    lines.push(line);
  });
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function noteLines(ctx, { w, text, fontSize, maxLines }) {
  ctx.save();
  ctx.font = `${fontSize}px "Patrick Hand", "Comic Sans MS", cursive`;
  let lines = wrap(ctx, text, w - 96);
  ctx.restore();
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] += '…'; }
  return lines;
}

function noteHeight(lines, fontSize, label) {
  return 96 + lines.length * Math.round(fontSize * 1.5) + (label ? 56 : 0);
}

function drawNote(ctx, { x, y, w, text, paper, fontSize, maxLines, label, rotate = 0 }) {
  const [bg, ink, line] = PAPER[paper] || PAPER.kem;
  const lh = Math.round(fontSize * 1.5);
  const lines = noteLines(ctx, { w, text, fontSize, maxLines });
  const h = noteHeight(lines, fontSize, label);
  ctx.save();
  ctx.font = `${fontSize}px "Patrick Hand", "Comic Sans MS", cursive`;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  roundRect(ctx, 0, 0, w, h, 18); ctx.fillStyle = bg; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = line; ctx.lineWidth = 2;
  for (let i = 0; i < lines.length; i++) {
    const ly = 48 + (i + 1) * lh + 10;
    ctx.beginPath(); ctx.moveTo(40, ly); ctx.lineTo(w - 40, ly); ctx.stroke();
  }
  ctx.fillStyle = ink; ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, 48, 48 + (i + 1) * lh));
  if (label) {
    ctx.font = '500 28px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.globalAlpha = 0.7; ctx.fillText(label, 48, h - 40); ctx.globalAlpha = 1;
  }
  ctx.restore();
  return h;
}

function drawLogo(ctx, cx, y) {
  ctx.save();
  ctx.font = '600 56px "Lora", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3A1622';
  ctx.fillText('J O M I', cx + 36, y);
  ctx.translate(cx - 120, y - 44); ctx.scale(2.4, 2.4);
  ctx.strokeStyle = '#3A1622'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.stroke(new Path2D('M6.5 4.5C3.6 6.6 2.6 10.7 4.4 14.2c1.7 3.3 5.7 5.2 9.6 4.4'));
  ctx.stroke(new Path2D('M17.5 4.5c2.9 2.1 3.9 6.2 2.1 9.7-1.7 3.3-5.7 5.2-9.6 4.4'));
  ctx.fillStyle = '#D6336C';
  ctx.fill(new Path2D('M12 15.4c-1.9-1.2-3.4-2.6-3.4-4.3a1.75 1.75 0 0 1 3.4-.6 1.75 1.75 0 0 1 3.4.6c0 1.7-1.5 3.1-3.4 4.3z'));
  ctx.restore();
}

/**
 * mode: 'letter' | 'reply' | 'both'
 * Trả về Blob PNG 1080×1920.
 */
export async function makeStoryImage({ letter, reply, mode, labels = {} }) {
  const L = { dear: 'Gửi người lạ,', stranger: 'một người lạ', replyFrom: 'Hồi âm từ một người lạ', ...labels };
  try {
    await Promise.all([
      document.fonts.load('48px "Patrick Hand"'),
      document.fonts.load('600 56px "Lora"'),
      document.fonts.load('500 28px "Be Vietnam Pro"'),
    ]);
  } catch (e) { /* dùng font dự phòng */ }

  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, '#FFE0E9'); bg.addColorStop(1, '#FFF4E6');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // phong bì phía sau
  const ex = 90, ew = W - 180, ey = 1180, eh = 520;
  ctx.fillStyle = '#EE9AB2';
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + ew, ey); ctx.lineTo(ex + ew / 2, ey - 300); ctx.closePath(); ctx.fill();
  roundRect(ctx, ex, ey, ew, eh, 28); ctx.fillStyle = '#F4B3C5'; ctx.fill();

  const showLetter = mode !== 'reply' || !reply;
  const both = mode === 'both' && reply;
  let letterBottom = 200;
  if (showLetter) {
    const opt = { x: 150, w: W - 300, text: `${L.dear}\n${letter.body}`, paper: letter.paper, fontSize: 48, maxLines: both ? 10 : 14, label: letter.sign ? `— ${letter.sign}` : `— ${L.stranger}` };
    const h = noteHeight(noteLines(ctx, opt), opt.fontSize, opt.label);
    // đáy lá thư nhét nhẹ vào túi phong bì; hồi âm (nếu có) nằm đè phía trước
    const y = Math.max(150, ey + 80 - h);
    drawNote(ctx, { ...opt, y });
    letterBottom = y + h;
  }

  // túi phong bì phía trước
  ctx.fillStyle = '#F9C9D6';
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + ew / 2, ey + eh * 0.52); ctx.lineTo(ex + ew, ey); ctx.lineTo(ex + ew, ey + eh - 28);
  ctx.arcTo(ex + ew, ey + eh, ex + ew - 28, ey + eh, 28); ctx.lineTo(ex + 28, ey + eh); ctx.arcTo(ex, ey + eh, ex, ey + eh - 28, 28); ctx.closePath(); ctx.fill();

  if (reply && mode === 'both') {
    drawNote(ctx, { x: 200, y: Math.max(ey + 40, Math.min(letterBottom - 60, ey + 120)), w: W - 300, text: reply.body, paper: 'kem', fontSize: 40, maxLines: 5, label: L.replyFrom, rotate: -3 });
  }
  if (reply && mode === 'reply') {
    drawNote(ctx, { x: 130, y: 560, w: W - 260, text: reply.body, paper: 'kem', fontSize: 56, maxLines: 9, label: L.replyFrom, rotate: -2 });
  }

  drawLogo(ctx, W / 2, H - 90);

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

/** Mở bảng chia sẻ của điện thoại; nếu không được thì tải ảnh về. */
export async function shareImage(blob, title = 'JOMI') {
  const file = new File([blob], 'jomi-story.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jomi-story.png';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
