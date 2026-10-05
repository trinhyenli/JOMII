import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key) : null;

// Tên đăng nhập: 3–20 ký tự, chỉ chữ không dấu và số
export const USERNAME_RE = /^[a-z0-9]{3,20}$/;

// Supabase cần email, nên JOMI đổi tên đăng nhập thành một email ảo ở phía sau.
// Người dùng không bao giờ nhập hay nhìn thấy email này.
const EMAIL_DOMAIN = import.meta.env.VITE_EMAIL_DOMAIN || 'users.jomi.app';
export const toEmail = (username) => `${username}@${EMAIL_DOMAIN}`;

// Gom lỗi Supabase thành câu tiếng Việt dễ hiểu
// Trả về khoá trong từ điển i18n (hoặc nguyên văn lỗi nếu không nhận ra)
export function errorKey(error) {
  const m = (error && error.message) || String(error || '');
  if (/Invalid login credentials/i.test(m)) return { key: 'eWrong' };
  if (/already registered/i.test(m)) return { key: 'userTaken' };
  if (/email_address_invalid|Email address .* is invalid/i.test(m)) return { key: 'eEmailDomain' };
  if (/Password should be/i.test(m)) return { key: 'passShort' };
  if (/row-level security/i.test(m)) return { key: 'eRls' };
  if (/Failed to fetch|NetworkError/i.test(m)) return { key: 'eNetwork' };
  if (/gửi hơi nhanh/i.test(m)) return { key: 'eRate' };
  return { text: m.replace(/^.*?ERROR:\s*/, '') };
}

// Dùng trong trang quản trị (tiếng Việt)
export function viError(error) { return errText(error, null); }

// Chuyển lỗi thành câu theo ngôn ngữ đang chọn (t = từ điển; null = tiếng Việt)
export function errText(error, t) {
  const r = errorKey(error);
  if (r.text !== undefined) return r.text;
  return t ? t[r.key] : VI_ERR[r.key];
}

const VI_ERR = {
  eWrong: 'Sai tên đăng nhập hoặc mật khẩu.', userTaken: 'Tên này đã có người dùng, bạn chọn tên khác nhé.',
  eEmailDomain: 'Máy chủ chưa nhận tên miền email ảo. Quản trị viên xem mục “Gặp lỗi?” trong README.',
  passShort: 'Mật khẩu cần ít nhất 6 ký tự.', eRls: 'Bạn không có quyền làm việc này.',
  eNetwork: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.', eRate: 'Bạn gửi hơi nhanh rồi, nghỉ một chút rồi viết tiếp nhé.',
};
