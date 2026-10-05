import { useState } from 'react';
import { supabase, toEmail, USERNAME_RE, errText } from '../lib/supabase.js';
import { useLang, LangSwitch } from '../lib/i18n.jsx';
import { HugLogo, IconEye } from '../components/Icons.jsx';

export default function Login() {
  const { t } = useLang();
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

  let userHint = t.userRule;
  let userBad = false;
  if (uname && !userValid) userBad = true;
  else if (uname && taken) { userHint = t.userTaken; userBad = true; }
  else if (uname && userValid) userHint = t.userOk;

  const switchTab = (t) => { setTab(t); setError(''); setNotice(''); setPassword(''); setConfirm(''); };

  async function checkName() {
    if (!isSignup || !userValid) return;
    const { data } = await supabase.rpc('username_available', { u: uname });
    setTaken(data === false);
  }

  async function onLogin(e) {
    e.preventDefault();
    if (!uname || !password) { setError(t.needCreds); return; }
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: toEmail(uname), password });
    setBusy(false);
    if (err) setError(errText(err, t));
  }

  async function onSignup(e) {
    e.preventDefault();
    if (!canCreate) return;
    setBusy(true); setError('');
    const { data: free } = await supabase.rpc('username_available', { u: uname });
    if (free === false) { setTaken(true); setBusy(false); return; }
    const { data, error: err } = await supabase.auth.signUp({ email: toEmail(uname), password, options: { data: { username: uname } } });
    setBusy(false);
    if (err) { setError(errText(err, t)); return; }
    if (!data.session) {
      setTab('login'); setPassword(''); setConfirm('');
      setNotice(t.confirmEmailOn);
    }
  }

  return (
    <div className="lg login-wrap">
      <LangSwitch className="lang-float" />
      <span className="blob" style={{ width: 420, height: 420, left: -120, top: -100, background: '#FFC2D4' }} aria-hidden="true" />
      <span className="blob" style={{ width: 380, height: 380, right: -100, bottom: -120, background: '#FFD7B5' }} aria-hidden="true" />
      <div className="login-grid">
        <section className="login-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <HugLogo size={72} className="hug-big" heart="#C2255C" />
            <span className="display" style={{ fontSize: 52, fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1 }}>JOMI</span>
          </div>
          <h1 className="display">{t.tagline}</h1>
          <p>{t.loginLead}</p>
        </section>

        <form className="login-card" onSubmit={isSignup ? onSignup : onLogin} noValidate>
          <div className="tabs" role="group" aria-label={t.choose}>
            <button type="button" className={isSignup ? 'tab' : 'tab is-on'} onClick={() => switchTab('login')} aria-pressed={!isSignup}>{t.login}</button>
            <button type="button" className={isSignup ? 'tab is-on' : 'tab'} onClick={() => switchTab('signup')} aria-pressed={isSignup}>{t.signup}</button>
          </div>

          {notice && <p role="status" className="ok-note">{notice}</p>}

          <div className="fieldset">
            <label htmlFor="u" className="lbl">{t.username}</label>
            <input id="u" className={isSignup && userBad ? 'field is-bad' : 'field'} type="text" autoComplete="username" maxLength={20}
              placeholder={t.userPh} value={username}
              onChange={(e) => { setUsername(e.target.value.replace(/\s/g, '')); setTaken(false); setError(''); }} onBlur={checkName} />
            {isSignup && <span className={userBad ? 'bad' : 'hint'}>{userHint}</span>}
          </div>

          <div className="fieldset">
            <label htmlFor="p" className="lbl">{t.password}</label>
            <div style={{ position: 'relative' }}>
              <input id="p" className={isSignup && password && !passValid ? 'field is-bad' : 'field'} type={show ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'} maxLength={64} placeholder={t.passMin}
                value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} style={{ paddingRight: 56 }} />
              <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? t.hidePass : t.showPass} aria-pressed={show}><IconEye size={20} /></button>
            </div>
            {isSignup && <span className={password && !passValid ? 'bad' : 'hint'}>{password && !passValid ? t.passShort : `${t.passMin}.`}</span>}
          </div>

          {isSignup && (
            <>
              <div className="fieldset">
                <label htmlFor="c" className="lbl">{t.confirmPass}</label>
                <input id="c" className={confirmBad ? 'field is-bad' : 'field'} type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={64}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {confirmBad && <span className="bad">{t.mismatch}</span>}
              </div>
              <p className="hint soft-box">{t.noRecovery}</p>
            </>
          )}

          {error && <p className="bad" role="alert" style={{ margin: 0 }}>{error}</p>}
          <button type="submit" className={(isSignup ? canCreate : !busy) ? 'btn' : 'btn is-off'} disabled={busy}>
            {busy ? t.busy : isSignup ? t.signup : t.login}
          </button>
          {!isSignup && (
            <p className="hint" style={{ margin: 0, textAlign: 'center' }}>
              {t.noAccount} <button type="button" className="link-btn" onClick={() => switchTab('signup')}>{t.quickSignup}</button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
