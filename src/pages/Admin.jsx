import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, viError } from '../lib/supabase.js';
import { MOODS, RIBBONS, fmtIsoDate, seasonStatus, timeAgo, pad } from '../lib/constants.js';
import { HugLogo, IconLogout, IconClose } from '../components/Icons.jsx';

const NAV = [['overview', 'Tổng quan'], ['moderation', 'Kiểm duyệt'], ['seasons', 'Hũ thư mùa'], ['messages', 'Thông điệp'], ['safety', 'Từ khoá & an toàn']];
const TYPE_LABEL = { letter: 'Thư', reply: 'Hồi âm', message: 'Thông điệp' };
const PRIO = { support: ['Cần hỗ trợ', 'badge b-info', 0], high: ['Ưu tiên cao', 'badge b-crit', 1], normal: ['Thường', 'badge b-warn', 2] };
const RESULT = { kept: ['Đã giữ nguyên', 'badge b-good'], hidden: ['Đã ẩn', 'badge b-warn'], removed: ['Đã xoá', 'badge b-crit'], supported: ['Đã gửi lời nhắn hỗ trợ', 'badge b-info'] };
const STATUS = { soon: ['Sắp mở', 'badge b-info'], open: ['Đang mở', 'badge b-good'], closed: ['Đã qua', 'badge b-neutral'] };

function Overview({ go, pending, support }) {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [moods, setMoods] = useState([]);
  const [openSeason, setOpenSeason] = useState(null);

  useEffect(() => {
    const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
    const since14 = new Date(Date.now() - 13 * 864e5); since14.setHours(0, 0, 0, 0);
    Promise.all([
      supabase.from('letters').select('id', { count: 'exact', head: true }).eq('kind', 'letter').gte('created_at', since7),
      supabase.from('replies').select('id', { count: 'exact', head: true }).gte('created_at', since7),
      supabase.from('hugs').select('letter_id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([a, b, c, d]) => setStats({ letters: a.count || 0, replies: b.count || 0, hugs: c.count || 0, users: d.count || 0 }));
    supabase.from('letters').select('created_at, mood').eq('kind', 'letter').gte('created_at', since14.toISOString()).limit(10000).then(({ data }) => {
      const rows = data || [];
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        days.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, v: 0 });
      }
      rows.forEach((r) => {
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const slot = days.find((x) => x.key === key); if (slot) slot.v += 1;
      });
      setDaily(days);
      const total = rows.length || 1;
      setMoods(MOODS.map((m) => ({ label: m, n: rows.filter((r) => r.mood === m).length })).map((m) => ({ ...m, pct: Math.round((m.n / total) * 100) })).sort((x, y) => y.n - x.n));
    });
    supabase.from('seasons').select('*').then(({ data }) => setOpenSeason((data || []).find((s) => seasonStatus(s) === 'open') || null));
  }, []);

  const max = Math.max(1, ...daily.map((d) => d.v));
  const maxPct = Math.max(1, ...moods.map((m) => m.pct));
  const tiles = [['Thư mới', stats?.letters, '7 ngày gần nhất'], ['Hồi âm', stats?.replies, '7 ngày gần nhất'], ['Cái ôm', stats?.hugs, 'Tổng cộng'], ['Tài khoản', stats?.users, 'Tổng cộng']];

  return (
    <>
      <div className="ad-head">
        <div><h1 className="display">Tổng quan</h1><p className="sub">Số liệu thật từ cơ sở dữ liệu</p></div>
        <button className="btn btn-primary" onClick={() => go('moderation')}>Xử lý {pending} báo cáo</button>
      </div>
      <div className="ad-tiles">
        {tiles.map(([label, v, note]) => (
          <div key={label} className="card tile-stat"><span className="sub">{label}</span><span className="display big">{v ?? '…'}</span><span className="sub">{note}</span></div>
        ))}
        <div className="card tile-stat"><span className="sub">Báo cáo chờ xử lý</span><span className="display big">{pending}</span>
          <span className={support ? 'badge b-info' : 'badge b-neutral'} style={{ alignSelf: 'flex-start' }}>{support} cần hỗ trợ</span></div>
      </div>
      <div className="ad-split">
        <section className="card ad-chart">
          <div><h2>Thư mới mỗi ngày</h2><p className="sub">14 ngày gần nhất · rê chuột lên cột để xem số</p></div>
          <div className="bars" role="img" aria-label="Biểu đồ cột số thư mới mỗi ngày trong 14 ngày">
            {daily.map((d) => (
              <div key={d.key} className="bar-col" tabIndex={0} aria-label={`${d.label}: ${d.v} thư`}>
                <span className="bar" style={{ height: `${Math.max(2, (d.v / max) * 100)}%` }} />
                <span className="tip">{d.label} · {d.v} thư</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}><span>{daily[0]?.label}</span><span>{daily[daily.length - 1]?.label}</span></div>
        </section>
        <section className="card ad-moods">
          <h2>Thư theo tâm trạng (14 ngày)</h2>
          {moods.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>{m.label}</span><span style={{ color: 'var(--muted)' }}>{m.pct}%</span></div>
              <div className="hbar-track"><div className="hbar" style={{ width: `${(m.pct / maxPct) * 100}%` }} /></div>
            </div>
          ))}
        </section>
      </div>
      <section className="card ad-row">
        <div style={{ flex: '1 1 300px' }}>
          <h2>Hũ thư đang mở: {openSeason ? openSeason.name : 'chưa có'}</h2>
          <p className="sub">{openSeason ? `${fmtIsoDate(openSeason.open_date)} – ${fmtIsoDate(openSeason.close_date)}` : 'Không có hũ nào đang mở.'}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => go('seasons')}>Quản lý hũ thư mùa</button>
      </section>
    </>
  );
}

function Moderation({ reports, reload, toast }) {
  const [tab, setTab] = useState('pending');
  const [type, setType] = useState('all');
  const list = reports
    .filter((r) => (tab === 'pending' ? r.status === 'pending' : r.status !== 'pending') && (type === 'all' || r.target_type === type))
    .sort((a, b) => PRIO[a.priority][2] - PRIO[b.priority][2]);
  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  async function act(r, action, msg) {
    const { error } = await supabase.rpc('admin_resolve_report', { rid: r.id, action });
    if (error) toast(viError(error)); else { if (msg) toast(msg); reload(); }
  }

  return (
    <>
      <div><h1 className="display">Kiểm duyệt</h1><p className="sub">Nội dung bị người dùng báo cáo hoặc bị hệ thống tự gắn cờ. Mục “Cần hỗ trợ” luôn nằm trên cùng.</p></div>
      <div className="ad-filters">
        <div className="row-gap">
          <button className={tab === 'pending' ? 'chip is-on' : 'chip'} onClick={() => setTab('pending')}>Chờ xử lý ({pendingCount})</button>
          <button className={tab === 'done' ? 'chip is-on' : 'chip'} onClick={() => setTab('done')}>Đã xử lý ({reports.length - pendingCount})</button>
        </div>
        <div className="row-gap">
          {['all', 'letter', 'reply', 'message'].map((t) => <button key={t} className={type === t ? 'chip is-on' : 'chip'} aria-pressed={type === t} onClick={() => setType(t)}>{t === 'all' ? 'Tất cả' : TYPE_LABEL[t]}</button>)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {list.map((r) => (
          <article key={r.id} className="card ad-report">
            <div className="row-gap" style={{ alignItems: 'center' }}>
              <span className={PRIO[r.priority][1]}>{PRIO[r.priority][0]}</span>
              <span className="badge b-neutral">{TYPE_LABEL[r.target_type]}</span>
              <span className="sub">{r.reason} · {r.report_count} lượt · {timeAgo(r.created_at)}</span>
              {r.status !== 'pending' && <span className={RESULT[r.status][1]} style={{ marginLeft: 'auto' }}>{RESULT[r.status][0]}</span>}
            </div>
            <p className="hand ad-quote">{r.content || '(nội dung đã bị xoá)'}</p>
            {r.priority === 'support' && r.status === 'pending' && (
              <p className="sub" style={{ color: 'var(--info)' }}>Gợi ý: gửi lời nhắn hỗ trợ ẩn danh kèm thông tin đường dây hỗ trợ tâm lý tới người viết. Không nên xoá ngay — người viết có thể đang cần được lắng nghe.</p>
            )}
            <div className="row-gap" style={{ justifyContent: 'flex-end' }}>
              {r.status === 'pending' ? (
                <>
                  {r.priority === 'support' && <button className="btn btn-support" onClick={() => act(r, 'support', 'Đã gửi lời nhắn hỗ trợ ẩn danh tới người viết.')}>Gửi lời nhắn hỗ trợ</button>}
                  <button className="btn btn-ghost" onClick={() => act(r, 'keep', 'Đã giữ nguyên nội dung.')}>Giữ nguyên</button>
                  <button className="btn btn-ghost" onClick={() => act(r, 'hide', 'Đã ẩn khỏi công khai.')}>Ẩn khỏi công khai</button>
                  <button className="btn btn-danger" onClick={() => act(r, 'remove', 'Đã xoá nội dung.')}>Xoá</button>
                </>
              ) : <button className="btn btn-ghost" onClick={() => act(r, 'undo', 'Đã hoàn tác.')}>Hoàn tác</button>}
            </div>
          </article>
        ))}
        {list.length === 0 && <p className="card" style={{ margin: 0, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Không còn mục nào ở đây.</p>}
      </div>
    </>
  );
}

function Seasons({ toast }) {
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [f, setF] = useState({ name: '', description: '', open_date: '', close_date: '', ribbon: '#2F6FD6' });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase.from('seasons').select('*').order('open_date').then(({ data }) => setRows(data || []));
    supabase.from('letters').select('season_id').eq('kind', 'scroll').limit(20000).then(({ data }) => {
      const c = {}; (data || []).forEach((r) => { c[r.season_id] = (c[r.season_id] || 0) + 1; }); setCounts(c);
    });
  }, [reload]);

  const dateError = f.open_date && f.close_date && f.close_date <= f.open_date;
  const canCreate = f.name.trim() && f.open_date && f.close_date && !dateError;

  async function create() {
    if (!canCreate) return;
    const { error } = await supabase.from('seasons').insert({ ...f, name: f.name.trim(), description: f.description.trim() });
    if (error) { toast(viError(error)); return; }
    toast(`Đã tạo hũ thư ${f.name.trim()}.`);
    setF({ name: '', description: '', open_date: '', close_date: '', ribbon: f.ribbon });
    setReload((r) => r + 1);
  }
  async function toggle(s) {
    await supabase.from('seasons').update({ visible: !s.visible }).eq('id', s.id); setReload((r) => r + 1);
  }
  async function remove(s) {
    if (!window.confirm(`Xoá hũ thư "${s.name}" và toàn bộ cuộn thư bên trong?`)) return;
    const { error } = await supabase.from('seasons').delete().eq('id', s.id);
    if (error) toast(viError(error)); else { toast(`Đã xoá hũ thư ${s.name}.`); setReload((r) => r + 1); }
  }

  return (
    <>
      <div><h1 className="display">Hũ thư mùa</h1><p className="sub">Trạng thái tự đổi theo ngày mở và ngày đóng. Bật “Hiện cho người dùng” để hũ xuất hiện trên trang.</p></div>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Dịp</th><th>Mở</th><th>Đóng</th><th>Trạng thái</th><th>Cuộn thư</th><th>Hiện cho người dùng</th><th /></tr></thead>
          <tbody>
            {rows.map((s) => {
              const st = STATUS[seasonStatus(s)];
              return (
                <tr key={s.id}>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: s.ribbon }} aria-hidden="true" />{s.name}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtIsoDate(s.open_date)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtIsoDate(s.close_date)}</td>
                  <td><span className={st[1]}>{st[0]}</span></td>
                  <td>{counts[s.id] || 0}</td>
                  <td><button className={s.visible ? 'switch is-on' : 'switch'} onClick={() => toggle(s)} role="switch" aria-checked={s.visible} aria-label={`Hiện ${s.name} cho người dùng`} /></td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-danger" style={{ height: 36, padding: '0 14px' }} onClick={() => remove(s)}>Xoá</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <section className="card ad-form">
        <h2>Tạo hũ thư mới</h2>
        <div className="ad-grid3">
          <div className="fs"><label htmlFor="s-name" className="lbl">Tên dịp</label><input id="s-name" className="field" maxLength={30} placeholder="Ví dụ: Ngày của Mẹ" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="fs"><label htmlFor="s-open" className="lbl">Ngày mở</label><input id="s-open" className="field" type="date" value={f.open_date} onChange={(e) => setF({ ...f, open_date: e.target.value })} /></div>
          <div className="fs"><label htmlFor="s-close" className="lbl">Ngày đóng</label><input id="s-close" className="field" type="date" value={f.close_date} onChange={(e) => setF({ ...f, close_date: e.target.value })} /></div>
        </div>
        <div className="fs"><label htmlFor="s-desc" className="lbl">Lời giới thiệu hiển thị cho người dùng</label>
          <textarea id="s-desc" className="field" rows={3} maxLength={240} placeholder="Một câu mời mọi người thả thư vào hũ…" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="ad-row-between">
          <div className="row-gap" style={{ alignItems: 'center' }} role="group" aria-label="Màu ruy băng">
            <span className="lbl">Màu ruy băng</span>
            {RIBBONS.map(([hex, label]) => <button key={hex} className={f.ribbon === hex ? 'sw is-on' : 'sw'} style={{ background: hex }} aria-label={`Màu ${label}`} aria-pressed={f.ribbon === hex} onClick={() => setF({ ...f, ribbon: hex })} />)}
          </div>
          <button className="btn btn-primary" onClick={create} disabled={!canCreate}>Tạo hũ thư</button>
        </div>
        {dateError && <p style={{ margin: 0, fontSize: 13, color: 'var(--crit)' }}>Ngày đóng phải sau ngày mở.</p>}
      </section>
    </>
  );
}

function Messages({ toast, reload: reloadCounts }) {
  const [rows, setRows] = useState([]);
  const [approved, setApproved] = useState(0);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    supabase.from('messages').select('*').eq('status', 'pending').order('created_at').then(({ data }) => setRows(data || []));
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'approved').then(({ count }) => setApproved(count || 0));
  }, [reload]);
  async function set(m, status) {
    const { error } = await supabase.from('messages').update({ status }).eq('id', m.id);
    if (error) toast(viError(error)); else { toast(status === 'approved' ? 'Đã duyệt thông điệp.' : 'Đã từ chối thông điệp.'); setReload((r) => r + 1); reloadCounts(); }
  }
  return (
    <>
      <div><h1 className="display">Thông điệp chờ duyệt</h1><p className="sub">Thông điệp ngắn (tối đa 5 dòng) chỉ vào kho rút ngẫu nhiên sau khi duyệt. Đã duyệt: {approved}.</p></div>
      <div className="ad-msgs">
        {rows.map((m) => {
          const n = m.body.split('\n').length;
          return (
            <article key={m.id} className="card ad-msg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="sub">{timeAgo(m.created_at)}</span><span className={n <= 5 ? 'badge b-good' : 'badge b-crit'}>{n} / 5 dòng</span>
              </div>
              <p className="display" style={{ margin: 0, fontSize: 19, fontStyle: 'italic', lineHeight: 1.55, whiteSpace: 'pre-line', flexGrow: 1 }}>{m.body}</p>
              <div className="row-gap" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-danger" onClick={() => set(m, 'rejected')}>Từ chối</button>
                <button className="btn btn-primary" onClick={() => set(m, 'approved')}>Duyệt</button>
              </div>
            </article>
          );
        })}
      </div>
      {rows.length === 0 && <p className="card" style={{ margin: 0, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Đã duyệt hết thông điệp.</p>}
    </>
  );
}

function Safety({ toast }) {
  const [words, setWords] = useState([]);
  const [drafts, setDrafts] = useState({ blocked: '', support: '' });
  const [text, setText] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    supabase.from('keywords').select('*').order('word').then(({ data }) => setWords(data || []));
    supabase.from('settings').select('value').eq('key', 'support_text').maybeSingle().then(({ data }) => setText(data ? data.value : ''));
  }, [reload]);
  async function add(kind) {
    const word = drafts[kind].trim().toLowerCase();
    if (!word) return;
    const { error } = await supabase.from('keywords').insert({ word, kind });
    if (error) toast(/duplicate/i.test(error.message) ? 'Từ này đã có trong danh sách.' : viError(error));
    setDrafts({ ...drafts, [kind]: '' }); setReload((r) => r + 1);
  }
  async function remove(w) { await supabase.from('keywords').delete().eq('id', w.id); setReload((r) => r + 1); }
  async function saveText() {
    const { error } = await supabase.from('settings').upsert({ key: 'support_text', value: text });
    toast(error ? viError(error) : 'Đã lưu lời nhắn hỗ trợ.');
  }
  const box = (kind, title, desc) => (
    <section className="card ad-kw">
      <div><h2>{title}</h2><p className="sub">{desc}</p></div>
      <div className="row-gap">
        {words.filter((w) => w.kind === kind).map((w) => (
          <span key={w.id} className={kind === 'support' ? 'kw kw-support' : 'kw'}>{w.word}
            <button className="x-btn" onClick={() => remove(w)} aria-label={`Bỏ từ ${w.word}`}><IconClose size={14} sw={2.4} /></button></span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <label htmlFor={`kw-${kind}`} className="sr">Thêm từ</label>
        <input id={`kw-${kind}`} className="field" placeholder="Thêm từ…" value={drafts[kind]} onChange={(e) => setDrafts({ ...drafts, [kind]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add(kind)} />
        <button className="btn btn-ghost" onClick={() => add(kind)} disabled={!drafts[kind].trim()}>Thêm</button>
      </div>
    </section>
  );
  return (
    <>
      <div><h1 className="display">Từ khoá &amp; an toàn</h1><p className="sub">Áp dụng tự động cho thư, hồi âm, thông điệp và cuộn thư mới (kiểm tra ở máy chủ).</p></div>
      <div className="ad-split">
        {box('blocked', 'Từ bị chặn', 'Nội dung chứa các từ này bị ẩn ngay và chuyển vào Kiểm duyệt.')}
        {box('support', 'Từ khoá cần hỗ trợ', 'Không ẩn nội dung. Gắn cờ “Cần hỗ trợ” để bạn gửi lời nhắn hỗ trợ cho người viết.')}
      </div>
      <section className="card ad-form">
        <h2>Lời nhắn hỗ trợ gửi tới người viết</h2>
        <label htmlFor="support-text" className="lbl">Nội dung (nhớ thay số đường dây hỗ trợ thật)</label>
        <textarea id="support-text" className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={saveText}>Lưu</button></div>
      </section>
    </>
  );
}

export default function Admin({ profile, onSignOut, onViewUser }) {
  const [section, setSection] = useState('overview');
  const [reports, setReports] = useState([]);
  const [msgCount, setMsgCount] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const timer = useRef(null);
  const toast = useCallback((m) => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(''), 2600); }, []);

  const reload = useCallback(() => {
    supabase.rpc('admin_report_list').then(({ data }) => setReports(data || []));
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'pending').then(({ count }) => setMsgCount(count || 0));
  }, []);
  useEffect(() => { reload(); }, [reload, section]);

  const pending = reports.filter((r) => r.status === 'pending');
  const support = pending.filter((r) => r.priority === 'support').length;
  const counts = { moderation: pending.length, messages: msgCount };

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-logo">
          <HugLogo size={28} heart="#F48FB1" />
          <span className="display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.08em' }}>JOMI</span>
          <span className="ad-tag">Admin</span>
        </div>
        <nav aria-label="Quản trị" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(([id, label]) => (
            <button key={id} className={section === id ? 'side-btn is-on' : 'side-btn'} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}>
              <span className="dot" aria-hidden="true" />{label}{counts[id] > 0 && <span className="count">{counts[id]}</span>}
            </button>
          ))}
        </nav>
        <div className="ad-side-foot">
          <button className="side-link" onClick={onViewUser}>Xem trang người dùng</button>
          <button className="side-link" onClick={onSignOut}><IconLogout size={16} />Đăng xuất</button>
          <span className="side-muted">Đang đăng nhập: {profile.username}</span>
        </div>
      </aside>
      <main className="ad-main">
        {section === 'overview' && <Overview go={setSection} pending={pending.length} support={support} />}
        {section === 'moderation' && <Moderation reports={reports} reload={reload} toast={toast} />}
        {section === 'seasons' && <Seasons toast={toast} />}
        {section === 'messages' && <Messages toast={toast} reload={reload} />}
        {section === 'safety' && <Safety toast={toast} />}
      </main>
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
