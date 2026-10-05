import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useLang, LangSwitch } from '../lib/i18n.jsx';
import { COLOR_THEMES, SCENE_THEMES } from '../lib/constants.js';
import { HugLogo, IconPalette, IconPen, IconClose, IconLogout } from '../components/Icons.jsx';
import Feed from '../components/Feed.jsx';
import RandomLetter from '../components/RandomLetter.jsx';
import Messages from '../components/Messages.jsx';
import Seasons from '../components/Seasons.jsx';
import Future from '../components/Future.jsx';
import Write from '../components/Write.jsx';
import Mine from '../components/Mine.jsx';
import Viewer from '../components/Viewer.jsx';

const NAV = [['home', 'navHome'], ['random', 'navRandom'], ['message', 'navMessage'], ['season', 'navSeason'], ['future', 'navFuture'], ['mine', 'navMine']];
const THEME_KEYS = { hong: 'thHong', cam: 'thCam', dem: 'thDem', donsac: 'thDonsac', bacha: 'thBacha', sky: 'scSky', heaven: 'scHeaven', nature: 'scNature', beach: 'scBeach', nightbeach: 'scNight' };

function readTheme() { try { return localStorage.getItem('jomi-theme') || 'hong'; } catch (e) { return 'hong'; } }

export default function UserApp({ profile, onSignOut, onBackToAdmin }) {
  const { t } = useLang();
  const [screen, setScreen] = useState('home');
  const [seasonArg, setSeasonArg] = useState(null);
  const [theme, setTheme] = useState(readTheme);
  const [themeOpen, setThemeOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [viewer, setViewer] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [notices, setNotices] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const toastTimer = useRef(null);

  useEffect(() => { try { localStorage.setItem('jomi-theme', theme); } catch (e) { /* bỏ qua */ } }, [theme]);

  useEffect(() => {
    supabase.from('saves').select('letter_id').eq('user_id', profile.id).then(({ data }) => setSavedIds(new Set((data || []).map((r) => r.letter_id))));
    supabase.from('notices').select('*').eq('read', false).order('created_at').then(({ data }) => setNotices(data || []));
  }, [profile.id]);

  const toast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3200);
  }, []);

  const go = (s, arg) => { setScreen(s); setSeasonArg(s === 'season' ? arg || null : null); setThemeOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  async function toggleSave(letter) {
    const next = new Set(savedIds);
    if (next.has(letter.id)) {
      next.delete(letter.id); setSavedIds(next);
      await supabase.from('saves').delete().eq('letter_id', letter.id).eq('user_id', profile.id);
    } else {
      next.add(letter.id); setSavedIds(next);
      const { error } = await supabase.from('saves').insert({ letter_id: letter.id });
      if (error) toast(errText(error, t)); else toast(t.tKept);
    }
  }

  async function nextRandom() {
    const { data } = await supabase.rpc('random_letter', { exclude: viewer ? viewer.letter.id : null });
    if (data && data.length) setViewer({ letter: data[0], source: 'random' });
    else toast(t.noMore);
  }

  async function dismissNotice(n) {
    setNotices((xs) => xs.filter((x) => x.id !== n.id));
    await supabase.from('notices').update({ read: true }).eq('id', n.id);
  }

  const ctx = {
    profile, toast, savedIds, toggleSave,
    openLetter: (letter, source, seasonName) => { setThemeOpen(false); setViewer({ letter, source, seasonName }); },
    goMine: () => go('mine'),
  };

  return (
    <div className={`app theme-${theme}`}>
      <div className={`scene scene-${theme}`} aria-hidden="true" />

      <header className="topbar">
        <div className="topbar-in">
          <div className="topbar-row">
            <button className="nav-btn logo-btn" onClick={() => go('home')} aria-label={t.logoAria}>
              <HugLogo size={32} />
              <span className="display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '0.08em' }}>JOMI</span>
            </button>
            <div className="row-gap" style={{ gap: 10, alignItems: 'center' }}>
              <LangSwitch />
              <div style={{ position: 'relative' }}>
                <button className="btn btn-ghost sm" onClick={() => setThemeOpen(!themeOpen)} aria-expanded={themeOpen}><IconPalette /><span className="hide-xs">{t.look}</span></button>
                {themeOpen && (
                  <div className="pop" role="dialog" aria-label={t.pickTheme}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="display" style={{ fontSize: 19, fontWeight: 600 }}>{t.look}</span>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setThemeOpen(false)} aria-label={t.close}><IconClose size={16} /></button>
                    </div>
                    <div className="fieldset"><span className="label">{t.colors}</span>
                      <div className="chips" style={{ gap: 12 }}>
                        {COLOR_THEMES.map(([id, label]) => <button key={id} className={`sw sw-${id}${theme === id ? ' is-on' : ''}`} onClick={() => setTheme(id)} aria-label={`${t.colorWord} ${t[THEME_KEYS[id]]}`} title={t[THEME_KEYS[id]]} aria-pressed={theme === id} />)}
                      </div>
                    </div>
                    <div className="fieldset"><span className="label">{t.scenes}</span>
                      <div className="grid-3">
                        {SCENE_THEMES.map(([id, label]) => <button key={id} className={theme === id ? 'tile is-on' : 'tile'} onClick={() => setTheme(id)} aria-pressed={theme === id}><span className={`tp tp-${id}`} />{t[THEME_KEYS[id]]}</button>)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-primary sm hide-xs" onClick={() => go('write')}><IconPen size={17} />{t.write}</button>
            </div>
          </div>
          <nav className="navrow" aria-label={t.mainNav}>
            {NAV.map(([id, label]) => <button key={id} className={screen === id ? 'nav-btn is-active' : 'nav-btn'} aria-current={screen === id ? 'page' : undefined} onClick={() => go(id)}>{t[label]}</button>)}
          </nav>
        </div>
      </header>

      <main className="main">
        {notices.map((n) => (
          <div key={n.id} className="panel notice" role="status">
            <HugLogo size={28} />
            <p>{n.body}</p>
            <button className="icon-btn" onClick={() => dismissNotice(n)} aria-label={t.markRead}><IconClose size={16} /></button>
          </div>
        ))}
        {screen === 'home' && <Feed ctx={ctx} go={go} refreshKey={refreshKey} />}
        {screen === 'random' && <RandomLetter ctx={ctx} />}
        {screen === 'message' && <Messages ctx={ctx} />}
        {screen === 'season' && <Seasons ctx={ctx} initialSeason={seasonArg} refreshKey={refreshKey} />}
        {screen === 'future' && <Future ctx={ctx} refreshKey={refreshKey} />}
        {screen === 'write' && <Write ctx={ctx} onDone={() => { setRefreshKey((k) => k + 1); go('home'); }} />}
        {screen === 'mine' && <Mine ctx={ctx} refreshKey={refreshKey} go={go} />}
      </main>

      <footer className="footer">
        <div className="footer-in">
          <span className="display" style={{ fontStyle: 'italic' }}>{t.footer} · @{profile.username}</span>
          <div className="row-gap">
            {onBackToAdmin && <button className="btn btn-ghost sm" onClick={onBackToAdmin}>{t.backToAdmin}</button>}
            <button className="btn btn-ghost sm" onClick={onSignOut}><IconLogout size={16} />{t.logout}</button>
          </div>
        </div>
      </footer>

      {viewer && (
        <Viewer letter={viewer.letter} source={viewer.source} seasonName={viewer.seasonName} ctx={ctx}
          onClose={() => { setViewer(null); setRefreshKey((k) => k + 1); }}
          onNext={viewer.source === 'random' ? nextRandom : null} />
      )}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
