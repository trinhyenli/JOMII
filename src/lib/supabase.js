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
export function viError(error) {
  const m = (error && error.message) || String(error || '');
  if (/Invalid login credentials/i.test(m)) return 'Sai tên đăng nhập hoặc mật khẩu.';
  if (/already registered/i.test(m)) return 'Tên này đã có người dùng, bạn chọn tên khác nhé.';
  if (/email_address_invalid|Email address .* is invalid/i.test(m)) return 'Máy chủ chưa nhận tên miền email ảo. Quản trị viên xem mục “Gặp lỗi?” trong README.';
  if (/Password should be/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if (/row-level security/i.test(m)) return 'Bạn không có quyền làm việc này.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.';
  return m.replace(/^.*?ERROR:\s*/, '');
}
