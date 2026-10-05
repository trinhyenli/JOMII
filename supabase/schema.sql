-- =====================================================================
-- JOMI — cơ sở dữ liệu cho Supabase
-- Cách dùng: Supabase → SQL Editor → New query → dán toàn bộ file → Run.
-- Chạy 1 lần trên dự án mới. Chạy lại sẽ báo lỗi "already exists".
-- =====================================================================

-- ---------- 1. Tài khoản ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9]{3,20}$'),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Tự tạo profile khi có người đăng ký (tên đăng nhập lấy từ metadata)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(new.raw_user_meta_data ->> 'username'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Cho trang đăng ký kiểm tra tên còn trống (không lộ danh sách tài khoản)
create function public.username_available(u text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where username = lower(u));
$$;

-- ---------- 2. Hũ thư mùa (admin tạo) ----------
create table public.seasons (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null default '',
  open_date date not null,
  close_date date not null check (close_date > open_date),
  ribbon text not null default '#2F6FD6',
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 3. Thư (thư thường, cuộn thư trong hũ, thư tương lai) ----------
create table public.letters (
  id bigint generated always as identity primary key,
  author_id uuid references auth.users (id) on delete cascade default auth.uid(),
  kind text not null default 'letter' check (kind in ('letter', 'scroll', 'future')),
  season_id bigint references public.seasons (id) on delete cascade,
  mood text not null default 'Tâm sự',
  mood_custom text not null default '',
  sign text not null default '',
  body text not null check (char_length(body) between 5 and 2000),
  paper text not null default 'kem',
  pattern text not null default 'lines',
  stamp text not null default 'hoa',
  song text not null default '',
  open_at timestamptz,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  check (kind <> 'scroll' or season_id is not null),
  check (kind <> 'future' or open_at is not null)
);
create index letters_feed_idx on public.letters (kind, status, created_at desc);

create table public.replies (
  id bigint generated always as identity primary key,
  letter_id bigint not null references public.letters (id) on delete cascade,
  author_id uuid references auth.users (id) on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 800),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);

create table public.hugs (
  letter_id bigint not null references public.letters (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  primary key (letter_id, user_id)
);

create table public.saves (
  letter_id bigint not null references public.letters (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (letter_id, user_id)
);

-- ---------- 4. Thông điệp ngẫu nhiên (cần admin duyệt) ----------
create table public.messages (
  id bigint generated always as identity primary key,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 5 and 220),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---------- 5. Kiểm duyệt ----------
create table public.reports (
  id bigint generated always as identity primary key,
  target_type text not null check (target_type in ('letter', 'reply', 'message')),
  target_id bigint not null,
  reporter_id uuid references auth.users (id) on delete set null default auth.uid(),
  reason text not null,
  priority text not null default 'normal' check (priority in ('support', 'high', 'normal')),
  status text not null default 'pending' check (status in ('pending', 'kept', 'hidden', 'removed', 'supported')),
  created_at timestamptz not null default now()
);

create table public.keywords (
  id bigint generated always as identity primary key,
  word text not null,
  kind text not null check (kind in ('blocked', 'support')),
  unique (word, kind)
);

create table public.settings (
  key text primary key,
  value text not null
);

-- Lời nhắn hỗ trợ admin gửi riêng tới người viết
create table public.notices (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 6. Quy tắc tự động: ẩn số điện thoại, giới hạn tốc độ, lọc từ khoá
-- =====================================================================
create function public.before_content() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n int;
  lim int;
begin
  -- Ẩn chuỗi giống số điện thoại
  new.body := regexp_replace(new.body, '\+?\d[\d .-]{7,}\d', '[đã ẩn số điện thoại]', 'g');
  -- Giới hạn tốc độ mỗi tài khoản
  lim := case tg_table_name when 'letters' then 10 when 'replies' then 30 else 10 end;
  execute format('select count(*) from public.%I where author_id = $1 and created_at > now() - interval ''1 hour''', tg_table_name)
    into n using new.author_id;
  if n >= lim and not public.is_admin() then
    raise exception 'Bạn gửi hơi nhanh rồi, nghỉ một chút rồi viết tiếp nhé.';
  end if;
  return new;
end $$;

create function public.after_content() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t text := case tg_table_name when 'letters' then 'letter' when 'replies' then 'reply' else 'message' end;
  hit_block boolean;
  hit_support boolean;
begin
  select exists (select 1 from keywords k where k.kind = 'blocked' and new.body ilike '%' || k.word || '%') into hit_block;
  select exists (select 1 from keywords k where k.kind = 'support' and new.body ilike '%' || k.word || '%') into hit_support;
  if hit_block then
    if tg_table_name = 'messages' then
      update messages set status = 'rejected' where id = new.id;
    else
      execute format('update public.%I set status = ''hidden'' where id = $1', tg_table_name) using new.id;
    end if;
    insert into reports (target_type, target_id, reporter_id, reason, priority)
    values (t, new.id, null, 'Tự động: chứa từ bị chặn', 'high');
  end if;
  if hit_support then
    insert into reports (target_type, target_id, reporter_id, reason, priority)
    values (t, new.id, null, 'Tự động: từ khoá cần hỗ trợ', 'support');
  end if;
  return null;
end $$;

create trigger letters_before before insert on public.letters for each row execute function public.before_content();
create trigger replies_before before insert on public.replies for each row execute function public.before_content();
create trigger messages_before before insert on public.messages for each row execute function public.before_content();
create trigger letters_after after insert on public.letters for each row execute function public.after_content();
create trigger replies_after after insert on public.replies for each row execute function public.after_content();
create trigger messages_after after insert on public.messages for each row execute function public.after_content();

-- =====================================================================
-- 7. Hàm dùng từ giao diện
-- =====================================================================
create function public.random_letter(exclude bigint default null) returns setof public.letters
language sql volatile security invoker set search_path = public as $$
  select * from letters
  where kind = 'letter' and status = 'visible'
    and author_id is distinct from auth.uid()
    and (exclude is null or id <> exclude)
  order by random() limit 1;
$$;

create function public.random_message(exclude bigint default null) returns setof public.messages
language sql volatile security invoker set search_path = public as $$
  select * from messages
  where status = 'approved' and (exclude is null or id <> exclude)
  order by random() limit 1;
$$;

-- Admin xử lý một báo cáo: keep | hide | remove | support | undo
create function public.admin_resolve_report(rid bigint, action text) returns void
language plpgsql security definer set search_path = public as $$
declare
  r reports;
  tbl text;
  author uuid;
begin
  if not is_admin() then raise exception 'Chỉ quản trị viên được làm việc này.'; end if;
  select * into r from reports where id = rid;
  if not found then raise exception 'Không tìm thấy báo cáo.'; end if;
  tbl := case r.target_type when 'letter' then 'letters' when 'reply' then 'replies' else 'messages' end;

  if action = 'keep' then
    update reports set status = 'kept' where id = rid;
  elsif action = 'hide' then
    if tbl = 'messages' then update messages set status = 'rejected' where id = r.target_id;
    else execute format('update public.%I set status = ''hidden'' where id = $1', tbl) using r.target_id; end if;
    update reports set status = 'hidden' where id = rid;
  elsif action = 'remove' then
    if tbl = 'messages' then update messages set status = 'rejected' where id = r.target_id;
    else execute format('update public.%I set status = ''removed'' where id = $1', tbl) using r.target_id; end if;
    update reports set status = 'removed' where id = rid;
  elsif action = 'support' then
    execute format('select author_id from public.%I where id = $1', tbl) into author using r.target_id;
    if author is not null then
      insert into notices (user_id, body)
      values (author, coalesce((select value from settings where key = 'support_text'), 'Người lạ ơi, bạn không một mình.'));
    end if;
    update reports set status = 'supported' where id = rid;
  elsif action = 'undo' then
    if r.status in ('hidden', 'removed') then
      if tbl = 'messages' then update messages set status = 'pending' where id = r.target_id;
      else execute format('update public.%I set status = ''visible'' where id = $1', tbl) using r.target_id; end if;
    end if;
    update reports set status = 'pending' where id = rid;
  else
    raise exception 'Hành động không hợp lệ.';
  end if;
end $$;

-- Lấy nội dung của mục bị báo cáo (chỉ admin)
create function public.admin_report_list() returns table (
  id bigint, target_type text, target_id bigint, reason text, priority text, status text,
  created_at timestamptz, content text, report_count bigint
)
language sql stable security definer set search_path = public as $$
  select r.id, r.target_type, r.target_id, r.reason, r.priority, r.status, r.created_at,
    case r.target_type
      when 'letter' then (select body from letters where letters.id = r.target_id)
      when 'reply' then (select body from replies where replies.id = r.target_id)
      else (select body from messages where messages.id = r.target_id) end,
    (select count(*) from reports r2 where r2.target_type = r.target_type and r2.target_id = r.target_id)
  from reports r
  where is_admin()
  order by r.created_at desc
  limit 300;
$$;

-- =====================================================================
-- 8. Phân quyền (Row Level Security)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.letters enable row level security;
alter table public.replies enable row level security;
alter table public.hugs enable row level security;
alter table public.saves enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.keywords enable row level security;
alter table public.settings enable row level security;
alter table public.notices enable row level security;

-- profiles: chỉ xem của mình; admin xem tất cả. Không ai tự sửa role được.
create policy "profiles_select" on public.profiles for select using (id = auth.uid() or public.is_admin());

-- seasons: ai đăng nhập cũng xem hũ đang hiển thị; admin toàn quyền
create policy "seasons_select" on public.seasons for select to authenticated using (visible or public.is_admin());
create policy "seasons_admin" on public.seasons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- letters: thư/cuộn thư công khai thì ai cũng đọc; thư tương lai chỉ chủ nhân; admin xem tất cả
create policy "letters_select" on public.letters for select to authenticated using (
  (kind in ('letter', 'scroll') and status = 'visible') or author_id = auth.uid() or public.is_admin()
);
create policy "letters_insert" on public.letters for insert to authenticated with check (
  author_id = auth.uid() and status = 'visible' and (
    kind <> 'scroll' or exists (
      select 1 from public.seasons s where s.id = season_id and s.visible and current_date between s.open_date and s.close_date
    )
  )
);
create policy "letters_admin_update" on public.letters for update to authenticated using (public.is_admin());

-- replies: chỉ người viết hồi âm, người viết thư gốc và admin đọc được
create policy "replies_select" on public.replies for select to authenticated using (
  author_id = auth.uid()
  or public.is_admin()
  or (status = 'visible' and exists (select 1 from public.letters l where l.id = letter_id and l.author_id = auth.uid()))
);
create policy "replies_insert" on public.replies for insert to authenticated with check (
  author_id = auth.uid() and status = 'visible'
  and exists (select 1 from public.letters l where l.id = letter_id and l.kind in ('letter', 'scroll') and l.status = 'visible')
);

-- hugs: đếm công khai, mỗi người chỉ thêm/bớt cái ôm của mình
create policy "hugs_select" on public.hugs for select to authenticated using (true);
create policy "hugs_insert" on public.hugs for insert to authenticated with check (user_id = auth.uid());
create policy "hugs_delete" on public.hugs for delete to authenticated using (user_id = auth.uid());

-- saves: hoàn toàn riêng tư
create policy "saves_own" on public.saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages: thấy thông điệp đã duyệt + của mình; admin duyệt
create policy "messages_select" on public.messages for select to authenticated using (status = 'approved' or author_id = auth.uid() or public.is_admin());
create policy "messages_insert" on public.messages for insert to authenticated with check (author_id = auth.uid() and status = 'pending');
create policy "messages_admin" on public.messages for update to authenticated using (public.is_admin());

-- reports: ai cũng báo cáo được; chỉ admin xem/sửa
create policy "reports_insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'pending' and priority = 'normal');
create policy "reports_admin" on public.reports for select to authenticated using (public.is_admin());

-- keywords: chỉ admin
create policy "keywords_admin" on public.keywords for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- settings: ai cũng đọc; admin sửa
create policy "settings_select" on public.settings for select to authenticated using (true);
create policy "settings_admin" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- notices: chỉ người nhận đọc và đánh dấu đã đọc
create policy "notices_select" on public.notices for select to authenticated using (user_id = auth.uid());
create policy "notices_update" on public.notices for update to authenticated using (user_id = auth.uid());

-- =====================================================================
-- 9. Dữ liệu khởi đầu (sửa thoải mái trong trang quản trị)
-- =====================================================================
insert into public.settings (key, value) values
  ('support_text', 'Người lạ ơi, bạn không một mình. Nếu thấy quá sức, hãy gọi [SỐ ĐƯỜNG DÂY HỖ TRỢ TÂM LÝ] hoặc nói chuyện với một người bạn tin tưởng.');

insert into public.keywords (word, kind) values
  ('đồ ngu', 'blocked'), ('cút đi', 'blocked'), ('link kiếm tiền', 'blocked'), ('inbox mình', 'blocked'),
  ('không muốn cố nữa', 'support'), ('muốn biến mất', 'support'), ('không muốn sống', 'support'), ('tự làm đau', 'support');

insert into public.seasons (name, description, open_date, close_date, ribbon) values
  ('Trung thu', 'Những cuộn thư dưới trăng rằm.', '2026-09-10', '2026-09-30', '#E67E22'),
  ('Mùa thi', 'Một lời chúc, một mẹo ôn thi hay một câu động viên cho những người đang thức khuya với giáo trình.', '2026-10-01', '2026-10-31', '#2F6FD6'),
  ('Giáng sinh', 'Những lá thư cho mùa đông, cho người xa nhà và những buổi tối có đèn nhấp nháy.', '2026-12-01', '2026-12-31', '#C62828'),
  ('Tết', 'Lời chúc năm mới gửi người lạ, và những điều muốn bỏ lại phía sau năm cũ.', '2027-01-20', '2027-02-20', '#D4A017'),
  ('Valentine', 'Những lời chưa kịp nói với người mình thương.', '2027-02-07', '2027-02-16', '#E0457B');

insert into public.messages (author_id, body, status) values
  (null, E'Không phải ngày nào cũng tốt đẹp,\nnhưng ngày nào cũng có một điều tốt đẹp.\nHôm nay, thử tìm nó xem.', 'approved'),
  (null, E'Chậm cũng được.\nMiễn là đừng dừng lại quá lâu\nở nơi làm bạn đau.', 'approved'),
  (null, E'Nếu hôm nay mệt quá thì làm ít thôi.\nNghỉ ngơi cũng là một phần của cố gắng.', 'approved');

-- =====================================================================
-- 10. Quyền truy cập API (Supabase thường cấp sẵn; ghi rõ để chắc chắn)
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.random_letter(bigint), public.random_message(bigint),
  public.admin_resolve_report(bigint, text), public.admin_report_list(), public.is_admin() to authenticated;
