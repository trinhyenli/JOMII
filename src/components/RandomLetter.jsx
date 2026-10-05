import { useState } from 'react';
import { supabase, errText } from '../lib/supabase.js';
import { useLang } from '../lib/i18n.jsx';

export default function RandomLetter({ ctx }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  async function draw() {
    setBusy(true);
    const { data, error } = await supabase.rpc('random_letter', { exclude: null });
    setBusy(false);
    if (error) { ctx.toast(errText(error, t)); return; }
    if (!data || !data.length) { ctx.toast(t.noOthers); return; }
    ctx.openLetter(data[0], 'random');
  }

  return (
    <section className="center-col">
      <p className="eyebrow">{t.randomEyebrow}</p>
      <h1 className="display h-lg" style={{ maxWidth: 720 }}>{t.randomH1}</h1>
      <p className="lead" style={{ maxWidth: 560 }}>{t.randomLead}</p>
      <div aria-hidden="true" className="float-field">
        <div style={{ left: '4%', top: 70, transform: 'rotate(-12deg)' }}><div className="float-env mini-env" /></div>
        <div style={{ left: '24%', top: 10, transform: 'rotate(7deg)' }}><div className="float-env f2 mini-env" /></div>
        <div style={{ left: '39%', top: 110, transform: 'rotate(-3deg) scale(1.35)' }}><div className="float-env f3 mini-env" /></div>
        <div style={{ left: '64%', top: 24, transform: 'rotate(14deg)' }}><div className="float-env f4 mini-env" /></div>
        <div style={{ left: '76%', top: 140, transform: 'rotate(-8deg) scale(.85)' }}><div className="float-env f5 mini-env" /></div>
      </div>
      <button className="btn btn-primary" onClick={draw} disabled={busy} style={{ height: 56, padding: '0 30px', fontSize: 16 }}>{busy ? t.drawing : t.drawOne}</button>
    </section>
  );
}
