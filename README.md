# JOMI — một cái ôm bằng lời, gửi người lạ

Website viết thư ẩn danh: Hòm thư chung, thư ngẫu nhiên, thông điệp ngẫu nhiên, hũ thư theo mùa, thư gửi tương lai, chia sẻ thành ảnh Story, và trang quản trị.

- Giao diện: React + Vite
- Cơ sở dữ liệu + đăng nhập: Supabase (miễn phí)
- Đưa lên mạng: Vercel (miễn phí, có sẵn địa chỉ `ten-ban-chon.vercel.app`)

---

## Cấu trúc thư mục

```
jomi/
├── supabase/schema.sql      ← chạy 1 lần trên Supabase để tạo toàn bộ cơ sở dữ liệu
├── src/
│   ├── App.jsx              ← chọn trang Đăng nhập / Người dùng / Quản trị
│   ├── pages/               ← Login, UserApp, Admin
│   ├── components/          ← Hòm thư, mở thư, hũ thư mùa, thông điệp, thư tương lai…
│   ├── lib/                 ← kết nối Supabase, vẽ ảnh Story
│   └── styles.css
├── .env.example             ← mẫu 2 biến môi trường
└── package.json
```

---

## Bước 1 — Tạo dự án Supabase

1. Vào https://supabase.com → **Start your project** → đăng nhập bằng GitHub.
2. **New project** → đặt tên `jomi` → Region **Southeast Asia (Singapore)** → đặt mật khẩu cơ sở dữ liệu (ghi lại) → Create.
3. Đợi khoảng 1–2 phút cho dự án sẵn sàng.

## Bước 2 — Tạo cơ sở dữ liệu

1. Trong Supabase, mở **SQL Editor** → **New query**.
2. Mở file `supabase/schema.sql`, copy toàn bộ, dán vào → bấm **Run**.
3. Thấy "Success. No rows returned" là xong. File này tạo bảng, phân quyền (Row Level Security), bộ lọc từ khoá, 5 hũ thư mùa và 3 thông điệp mẫu.

## Bước 3 — Tắt xác nhận email

JOMI chỉ dùng tên đăng nhập + mật khẩu. Ở phía sau, tên được đổi thành một email ảo (`ten@users.jomi.app`) nên phải tắt bước xác nhận email:

**Authentication → Sign In / Providers → Email** → tắt **Confirm email** → Save.

(Giữ nguyên "Allow new users to sign up" ở trạng thái bật.)

## Bước 4 — Chạy thử trên máy

Cần cài [Node.js](https://nodejs.org) bản 22 (LTS) trở lên.

1. Lấy 2 thông tin trong Supabase:
   - **URL:** mục **Data API** → ô **API URL** (dạng `https://xxxxxxxx.supabase.co`).
   - **Khoá:** bấm biểu tượng bánh răng **Project Settings** (góc dưới bên trái) → **API Keys** → copy **Publishable key** (bắt đầu bằng `sb_publishable_`). Nếu dự án của bạn còn tab **Legacy API Keys** thì khoá **anon public** (bắt đầu bằng `eyJ`) cũng dùng được.
   - **Không** dùng **Secret key** / `service_role`.
2. Trong thư mục `jomi`, copy file `.env.example` thành `.env` rồi điền:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   Chỉ dùng khoá **anon**. **Không bao giờ** dán khoá `service_role` vào đây.
3. Mở Terminal tại thư mục `jomi`:
   ```
   npm install
   npm run dev
   ```
4. Mở http://localhost:5173 → tạo tài khoản → viết thử một lá thư.

## Bước 5 — Đưa mã lên GitHub

1. Vào https://github.com → **New repository** → tên `jomi` → Create.
2. Cách dễ nhất: trên trang repo bấm **uploading an existing file**, kéo thả mọi thứ trong thư mục `jomi` **trừ** `node_modules`, `dist` và file `.env` → Commit.
   (Hoặc dùng GitHub Desktop; file `.gitignore` đã chặn sẵn 3 thứ trên.)

## Bước 6 — Đưa lên Vercel

1. Vào https://vercel.com → đăng nhập bằng GitHub → **Add New… → Project** → chọn repo `jomi` → **Import**.
2. Framework Preset tự nhận **Vite**. Mở **Environment Variables**, thêm 2 biến giống file `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Bấm **Deploy**. Khoảng 1 phút sau bạn có link dạng `jomi-xxxx.vercel.app`.
4. Đổi tên miền phụ cho đẹp: Project → **Settings → Domains** → sửa thành `jomi.vercel.app` (nếu tên còn trống).

## Bước 7 — Nối Supabase với link Vercel

Supabase → **Authentication → URL Configuration** → **Site URL** = link Vercel của bạn → Save.

## Bước 8 — Tạo tài khoản quản trị

1. Vào web, tạo một tài khoản bình thường (ví dụ `quantri`).
2. Supabase → **Table Editor → profiles** → tìm dòng `quantri` → sửa cột `role` từ `user` thành `admin` → Save.
3. Đăng xuất rồi đăng nhập lại: bạn sẽ vào thẳng trang quản trị.

Không có cách nào tự lên admin từ trang web — chỉ người có quyền vào Supabase mới làm được.

## Bước 9 — Việc cần làm trước khi chia sẻ rộng rãi

- Trang quản trị → **Từ khoá & an toàn** → sửa lời nhắn hỗ trợ, thay `[SỐ ĐƯỜNG DÂY HỖ TRỢ TÂM LÝ]` bằng số thật.
- Xem lại ngày mở/đóng của các hũ thư mùa (đang là dữ liệu mẫu 2026–2027).
- Thử nút **Instagram Story** trên một iPhone và một điện thoại Android thật.

Từ giờ, mỗi lần bạn sửa mã và đẩy lên GitHub, Vercel tự đưa bản mới lên mạng.

---

## Chia sẻ lên Instagram Story hoạt động thế nào

Trang web không thể tự đăng thẳng lên Story (Meta chỉ cho ứng dụng cài trên điện thoại làm việc đó). JOMI làm như sau:

1. Vẽ ảnh dọc **1080 × 1920** ngay trong trình duyệt (`src/lib/storyImage.js`).
2. Trên điện thoại: mở **bảng chia sẻ của máy** kèm ảnh → người dùng chọn **Instagram → Story** (hoặc TikTok).
3. Máy tính hoặc trình duyệt không hỗ trợ: tự tải ảnh về để người dùng đăng tay.

Tính năng này cần trang chạy trên **https** — link Vercel đã có sẵn.

---

## Những gì máy chủ tự làm (trong `schema.sql`)

| Quy tắc | Chi tiết |
| --- | --- |
| Hồi âm riêng tư | Chỉ người viết thư gốc, người viết hồi âm và admin đọc được |
| Thư tương lai | Chỉ chủ nhân đọc được |
| Ẩn số điện thoại | Chuỗi giống số điện thoại tự đổi thành `[đã ẩn số điện thoại]` |
| Giới hạn tốc độ | Tối đa 10 thư / 30 hồi âm / 10 thông điệp mỗi giờ cho một tài khoản |
| Từ bị chặn | Nội dung bị ẩn ngay và chuyển vào Kiểm duyệt |
| Từ khoá cần hỗ trợ | Gắn cờ "Cần hỗ trợ" để admin gửi lời nhắn hỗ trợ ẩn danh |
| Thông điệp ngẫu nhiên | Chỉ xuất hiện sau khi admin duyệt |
| Hũ thư mùa | Chỉ thả cuộn thư được khi hũ đang trong thời gian mở |

---

## Gặp lỗi?

| Hiện tượng | Cách xử lý |
| --- | --- |
| Trang báo "JOMI chưa được nối với Supabase" | Thiếu 2 biến môi trường. Trên Vercel thêm xong phải bấm **Redeploy** |
| Tạo tài khoản xong nhưng không vào được | Chưa tắt **Confirm email** (Bước 3) |
| "Database error saving new user" | Tên đăng nhập sai quy tắc (3–20 ký tự, chỉ chữ không dấu và số) |
| Không tải được gì, web trắng trơn sau 1 tuần | Gói miễn phí Supabase tạm dừng dự án sau 1 tuần không hoạt động → vào Supabase bấm **Restore** |
| Báo "Bạn gửi hơi nhanh rồi…" | Giới hạn tốc độ đang hoạt động đúng; đợi một lúc |
| Tạo tài khoản báo "chưa nhận tên miền email ảo" (email_address_invalid) | Supabase không chấp nhận tên miền `users.jomi.app`. Thêm biến `VITE_EMAIL_DOMAIN` (trong `.env` và trên Vercel) bằng một tên miền có thật — ví dụ tên miền riêng sau này của bạn — rồi Redeploy. Chỉ đổi khi **chưa** có người dùng, vì đổi sau sẽ làm tài khoản cũ không đăng nhập được |
| Quá nhiều lượt đăng ký bị chặn | Supabase giới hạn số lần đăng ký theo IP; chỉnh ở Authentication → Rate Limits |
