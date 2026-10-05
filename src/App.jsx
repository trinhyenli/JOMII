import { useEffect, useState } from 'react';
import { supabase, configured } from './lib/supabase.js';
import Login from './pages/Login.jsx';
import UserApp from './pages/UserApp.jsx';
import Admin from './pages/Admin.jsx';
import { HugLogo } from './components/Icons.jsx';
import { LangProvider, useLang } from './lib/i18n.jsx';

function Splash({ k }) {
  const { t } = useLang();
  return (
    <div className="lg splash">
      <HugLogo size={64} className="hug-big" />
      <p>{t[k]}</p>
    </div>
  );
}

function Setup() {
  return (
    <div className="lg splash" style={{ textAlign: 'left' }}>
      <div style={{ maxWidth: 560 }}>
        <h1 className="display">JOMI chưa được nối với Supabase</h1>
        <p>Tạo file <code>.env</code> ở thư mục gốc (hoặc thêm Environment Variables trên Vercel) với 2 dòng:</p>
        <pre>VITE_SUPABASE_URL=...{'\n'}VITE_SUPABASE_ANON_KEY=...</pre>
        <p>Xem hướng dẫn chi tiết trong README.md.</p>
      </div>
    </div>
  );
}

export default function App() {
  return <LangProvider><Root /></LangProvider>;
}

function Root() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [asUser, setAsUser] = useState(false);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); setAsUser(false); return; }
    supabase.from('profiles').select('id, username, role').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data || { id: session.user.id, username: '', role: 'user' }));
  }, [session]);

  if (!configured) return <Setup />;
  if (session === undefined) return <Splash k="splashOpen" />;
  if (!session) return <Login />;
  if (!profile) return <Splash k="splashBox" />;

  const signOut = () => supabase.auth.signOut();
  if (profile.role === 'admin' && !asUser) return <Admin profile={profile} onSignOut={signOut} onViewUser={() => setAsUser(true)} />;
  return <UserApp profile={profile} onSignOut={signOut} onBackToAdmin={profile.role === 'admin' ? () => setAsUser(false) : null} />;
}
