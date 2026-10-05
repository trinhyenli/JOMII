export const PER_PAGE = 9;

export const MOODS = ['Tâm sự', 'Buồn', 'Nhớ', 'Áp lực', 'Vui', 'Tình yêu', 'Khác'];

export const PAPERS = [
  ['kem', 'Kem'], ['hong', 'Hồng phấn'], ['xanh', 'Xanh trời'],
  ['bacha', 'Bạc hà'], ['tim', 'Tím oải hương'], ['dem', 'Đêm'],
];
export const PATTERNS = [['lines', 'Kẻ ngang'], ['grid', 'Ô ly'], ['dots', 'Chấm bi'], ['plain', 'Trơn']];
export const STAMPS = [['hoa', 'Hoa'], ['trang', 'Trăng'], ['song', 'Biển'], ['nui', 'Núi'], ['may', 'Mây']];

export const COLOR_THEMES = [['hong', 'Hồng'], ['cam', 'Cam'], ['dem', 'Tối'], ['donsac', 'Đơn sắc'], ['bacha', 'Bạc hà']];
export const SCENE_THEMES = [['sky', 'Bầu trời'], ['heaven', 'Thiên đường'], ['nature', 'Thiên nhiên'], ['beach', 'Bãi biển'], ['nightbeach', 'Biển đêm sao']];

export const RIBBONS = [['#2F6FD6', 'xanh dương'], ['#C62828', 'đỏ'], ['#D4A017', 'vàng'], ['#E0457B', 'hồng'], ['#E67E22', 'cam'], ['#2E8B57', 'xanh lá']];

export const pad = (n) => (n < 10 ? '0' : '') + n;
export const fmtDate = (d) => { const x = new Date(d); return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`; };
export const fmtIsoDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

export function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'Vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 2) return 'Hôm qua';
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} ngày trước`;
  return fmtDate(d);
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function seasonStatus(s) {
  const t = todayIso();
  if (t < s.open_date) return 'soon';
  if (t > s.close_date) return 'closed';
  return 'open';
}

export const moodLabel = (l) => (l.mood === 'Khác' && l.mood_custom ? `Khác · ${l.mood_custom}` : l.mood);

export const yearRange = (y) => [`${y}-01-01T00:00:00`, `${y + 1}-01-01T00:00:00`];

export function yearOptions(from = 2026) {
  const now = new Date().getFullYear();
  const out = [];
  for (let y = now; y >= from; y--) out.push(y);
  return out;
}
