import { useState } from 'react';
import { supabase, viError } from '../lib/supabase.js';

export default function RandomLetter({ ctx }) {
  const [busy, setBusy] = useState(false);

  async function draw() {
    setBusy(true);
    const { data, error } = await supabase.rpc('random_letter', { exclude: null });
    setBusy(false);
    if (error) { ctx.toast(viError(error)); return; }
    if (!data || !data.length) { ctx.toast('Hòm thư chưa có lá thư nào của người khác. Quay lại sau nhé!'); return; }
    ctx.openLetter(data[0], 'random');
  }

  return (
    <section className="center-col">
      <p className="eyebrow">Thư ngẫu nhiên</p>
      <h1 className="display h-lg" style={{ maxWidth: 720 }}>Có một lá thư đang đến với bạn.</h1>
      <p className="lead" style={{ maxWidth: 560 }}>Rút ngẫu nhiên một lá từ Hòm thư chung. Đọc, gửi một cái ôm, hoặc lật mặt sau để viết hồi âm.</p>
      <div aria-hidden="true" className="float-field">
        <div style={{ left: '4%', top: 70, transform: 'rotate(-12deg)' }}><div className="float-env mini-env" /></div>
        <div style={{ left: '24%', top: 10, transform: 'rotate(7deg)' }}><div className="float-env f2 mini-env" /></div>
        <div style={{ left: '39%', top: 110, transform: 'rotate(-3deg) scale(1.35)' }}><div className="float-env f3 mini-env" /></div>
        <div style={{ left: '64%', top: 24, transform: 'rotate(14deg)' }}><div className="float-env f4 mini-env" /></div>
        <div style={{ left: '76%', top: 140, transform: 'rotate(-8deg) scale(.85)' }}><div className="float-env f5 mini-env" /></div>
      </div>
      <button className="btn btn-primary" onClick={draw} disabled={busy} style={{ height: 56, padding: '0 30px', fontSize: 16 }}>{busy ? 'Đang rút…' : 'Rút một lá thư'}</button>
    </section>
  );
}
