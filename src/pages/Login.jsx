import { useState } from 'react';
import { supabase, toEmail, USERNAME_RE, viError } from '../lib/supabase.js';
import { HugLogo, IconEye } from '../components/Icons.jsx';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState(false);

  const isSignup = tab === 'signup';
  const uname = username.trim().toLowerCase();
  const userValid = USERNAME_RE.test(uname);
  const passValid = password.length >= 6;
  const confirmBad = isSignup && confirm.length > 0 && confirm !== password;
  const canCreate = userValid && !taken && passValid && confirm === password && !busy;

  let userHint = 'Từ 3–20 ký tự, chỉ gồm chữ (không dấu) và số. Không dùng ký tự đặc biệt hay khoảng trắng.';
  let userBad = false;
  if (uname && !userValid) userBad = true;
  else if (uname && taken) { userHint = 'Tên này đã có người dùng, bạn chọn tên khác nhé.'; userBad = true; }
  else if (uname && userValid) userHint = 'Tên này dùng được.';

  const switchTab = (t) => { setTab(t); setError(''); setNotice(''); setPassword(''); setConfirm(''); };

  async function checkName() {
    if (!isSignup || !userValid) return;
    const { data } = await supabase.rpc('username_available', { u: uname });
    setTaken(data === false);
  }

  async function onLogin(e) {
    e.preventDefault();
    if (!uname || !password) { setError('Bạn nhập tên đăng nhập và mật khẩu nhé.'); return; }
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: toEmail(uname), password });
    setBusy(false);
    if (err) setError(viError(err));
  }

  async function onSignup(e) {
    e.preventDefault();
    if (!canCreate) return;
    setBusy(true); setError('');
    const { data: free } = await supabase.rpc('username_available', { u: uname });
    if (free === false) { setTaken(true); setBusy(false); return; }
    const { data, error: err } = await supabase.auth.signUp({ email: toEmail(uname), password, options: { data: { username: uname } } });
    setBusy(false);
    if (err) { setError(viError(err)); return; }
    if (!data.session) {
      setTab('login'); setPassword(''); setConfirm('');
      setNotice('Đã tạo tài khoản. Nếu chưa vào được, quản trị viên cần tắt “Confirm email” trong Supabase.');
    }
  }

  return (
    <div className="lg login-wrap">
      <span className="blob" style={{ width: 420, height: 420, left: -120, top: -100, background: '#FFC2D4' }} aria-hidden="true" />
      <span className="blob" style={{ width: 380, height: 380, right: -100, bottom: -120, background: '#FFD7B5' }} aria-hidden="true" />
      <div className="login-grid">
        <section className="login-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <HugLogo size={72} className="hug-big" heart="#C2255C" />
            <span className="display" style={{ fontSize: 52, fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1 }}>JOMI</span>
          </div>
          <h1 className="display">Một cái ôm bằng lời, gửi người lạ.</h1>
          <p>Chỉ cần một cái tên và mật khẩu. Không email, không số điện thoại, không ai biết bạn là ai.</p>
        </section>

        <form className="login-card" onSubmit={isSignup ? onSignup : onLogin} noValidate>
          <div className="tabs" role="group" aria-label="Chọn">
            <button type="button" className={isSignup ? 'tab' : 'tab is-on'} onClick={() => switchTab('login')} aria-pressed={!isSignup}>Đăng nhập</button>
            <button type="button" className={isSignup ? 'tab is-on' : 'tab'} onClick={() => switchTab('signup')} aria-pressed={isSignup}>Tạo tài khoản</button>
          </div>

          {notice && <p role="status" className="ok-note">{notice}</p>}

          <div className="fieldset">
            <label htmlFor="u" className="lbl">Tên đăng nhập</label>
            <input id="u" className={isSignup && userBad ? 'field is-bad' : 'field'} type="text" autoComplete="username" maxLength={20}
              placeholder="vd: meocon2005" value={username}
              onChange={(e) => { setUsername(e.target.value.replace(/\s/g, '')); setTaken(false); setError(''); }} onBlur={checkName} />
            {isSignup && <span className={userBad ? 'bad' : 'hint'}>{userHint}</span>}
          </div>

          <div className="fieldset">
            <label htmlFor="p" className="lbl">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input id="p" className={isSignup && password && !passValid ? 'field is-bad' : 'field'} type={show ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'} maxLength={64} placeholder="Ít nhất 6 ký tự"
                value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} style={{ paddingRight: 56 }} />
              <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={show}><IconEye size={20} /></button>
            </div>
            {isSignup && <span className={password && !passValid ? 'bad' : 'hint'}>{password && !passValid ? 'Mật khẩu cần ít nhất 6 ký tự.' : 'Ít nhất 6 ký tự.'}</span>}
          </div>

          {isSignup && (
            <>
              <div className="fieldset">
                <label htmlFor="c" className="lbl">Nhập lại mật khẩu</label>
                <input id="c" className={confirmBad ? 'field is-bad' : 'field'} type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={64}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {confirmBad && <span className="bad">Hai mật khẩu chưa giống nhau.</span>}
              </div>
              <p className="hint soft-box">JOMI không lưu email hay số điện thoại, nên không thể lấy lại mật khẩu khi quên. Hãy ghi nhớ thật kỹ nhé.</p>
            </>
          )}

          {error && <p className="bad" role="alert" style={{ margin: 0 }}>{error}</p>}
          <button type="submit" className={(isSignup ? canCreate : !busy) ? 'btn' : 'btn is-off'} disabled={busy}>
            {busy ? 'Đang xử lý…' : isSignup ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
          {!isSignup && (
            <p className="hint" style={{ margin: 0, textAlign: 'center' }}>
              Chưa có tài khoản? <button type="button" className="link-btn" onClick={() => switchTab('signup')}>Tạo trong 10 giây</button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
