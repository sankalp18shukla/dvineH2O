'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../ui/Icon';
import styles from './ChatWidget.module.css';

type Msg = { from: 'user' | 'bot' | 'agent'; text: string; at: string; links?: { href: string; label: string }[] };
const KEY = 'dvine_chat';
const hello: Msg = { from: 'bot', text: 'Hey. Ask me anything.', at: '' };
const QUICK = ['Track my order', 'Book a water test', 'Installation', 'Talk to a person'];

// 4-point sparkle star, concave sides
const star = (cx: number, cy: number, r: number) => {
  const k = r * 0.18;
  return `M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`;
};

export function ChatWidget({ whatsapp }: { whatsapp: string | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([hello]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [handover, setHandover] = useState(false);
  const [live, setLive] = useState<{ ref: string; token: string } | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', error: '' });
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (s?.ref) { setLive({ ref: s.ref, token: s.token }); } } catch {} }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }, [msgs, open, handover]);
  // live mode: poll for agent replies while open
  useEffect(() => {
    if (!live || !open) return;
    let stop = false;
    const pull = async () => {
      const r = await fetch(`/api/chat?ref=${live.ref}&token=${live.token}`).catch(() => null);
      if (!r || stop) return;
      if (r.status === 404) { try { localStorage.removeItem(KEY); } catch {} setLive(null); return; }
      const j = await r.json(); if (j.transcript) setMsgs(j.transcript);
    };
    pull(); const t = setInterval(pull, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [live, open]);

  if (path.startsWith('/checkout/pay')) return null;

  const send = async (raw: string) => {
    const q = raw.trim(); if (!q || busy) return;
    if (q === 'Talk to a person' && !live) { setMsgs(m => [...m, { from: 'user', text: q, at: new Date().toISOString() }]); setHandover(true); return; }
    setText(''); setBusy(true);
    const mine: Msg = { from: 'user', text: q, at: new Date().toISOString() };
    setMsgs(m => [...m, mine]);
    try {
      if (live) {
        const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', ...live, text: q }) });
        const j = await r.json(); if (j.transcript) setMsgs(j.transcript);
      } else {
        const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ask', text: q }) });
        const j = await r.json(); setMsgs(m => [...m, j.reply]);
      }
    } finally { setBusy(false); }
  };

  const startLive = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'handover', name: form.name, phone: form.phone, transcript: msgs.filter(m => m.at).slice(-40), page: path }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setForm(f => ({ ...f, error: j.error ?? 'Please check your details.' })); return; }
    setLive({ ref: j.ref, token: j.token }); setMsgs(j.transcript); setHandover(false);
    try { localStorage.setItem(KEY, JSON.stringify({ ref: j.ref, token: j.token })); } catch {}
  };

  return (
    <div data-open={open} className={`${styles.root} no-print fixed right-4 bottom-[calc(16px+var(--action-bar,0px))] z-40 font-sans transition-[bottom] duration-300 sm:right-6 sm:bottom-[calc(24px+var(--action-bar,0px))]`}>
      <div role="dialog" aria-label="Chat with DVINE H2O" aria-hidden={!open} inert={!open} className={`${styles.panel} flex h-[min(600px,calc(100svh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden text-white`}>
          <div className={styles.orbs} aria-hidden="true"><i /><i /><i /></div>
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
            <span className={styles.avatar}><Icon name="drop" className="size-[18px]" strokeWidth={2} /></span>
            <p className="flex-1 text-[14px] font-semibold tracking-tight">DVINE H2O{live && <span className="ml-2 font-normal text-white/60">#{live.ref}</span>}</p>
            <button className={`${styles.glass} ${styles.round}`} aria-label="Close chat" onClick={() => setOpen(false)}><Icon name="close" className="size-4" strokeWidth={2} /></button>
          </div>
          <div ref={list} className={`${styles.list} flex-1 overflow-y-auto px-4 py-3`} aria-live="polite">
            {msgs.map((m, i) => {
              const mine = m.from === 'user';
              const first = i === 0 || msgs[i - 1].from !== m.from;
              return (
                <div key={i} className={`${styles.msg} flex ${mine ? 'justify-end' : 'justify-start'} ${first ? 'mt-3 first:mt-0' : 'mt-1'}`}>
                  <div className={`${styles.bubble} ${mine ? styles.mine : m.from === 'agent' ? styles.agent : styles.bot}`}>
                    {m.from === 'agent' && first && <p className="mb-0.5 text-[11px] font-semibold text-glacier">DVINE team</p>}
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.links && <div className="mt-2.5 flex flex-wrap gap-1.5">{m.links.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`${styles.glass} ${styles.pill}`}>{l.label}<Icon name="arrow" className="size-3.5" strokeWidth={2} /></Link>)}</div>}
                  </div>
                </div>
              );
            })}
            {busy && !live && !handover && <div className={`${styles.msg} mt-3 flex`} aria-label="Assistant is typing"><div className={`${styles.bubble} ${styles.bot} ${styles.typing}`}><i /><i /><i /></div></div>}
            {handover && (
              <form onSubmit={startLive} className={`${styles.msg} ${styles.glass} ${styles.card} mt-4 space-y-2`}>
                <p className="pb-1 text-[14px] font-semibold">Leave your number, we’ll reply here.</p>
                <label className="sr-only" htmlFor="chat-name">Name</label>
                <input id="chat-name" className={styles.field} placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, error: '' }))} required minLength={2} />
                <label className="sr-only" htmlFor="chat-phone">Mobile number</label>
                <input id="chat-phone" className={styles.field} placeholder="Mobile" inputMode="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value, error: '' }))} required />
                {form.error && <p className="text-[13px] font-medium text-flash">{form.error}</p>}
                <p className="text-[11.5px] text-white/55">Agreeing to our <Link href="/policies/privacy" className="underline">privacy policy</Link>.</p>
                <div className="flex gap-2 pt-1">
                  <button className={`${styles.cta} flex-1`} disabled={busy}>Connect</button>
                  <button type="button" className={`${styles.glass} ${styles.pill} justify-center px-4`} onClick={() => setHandover(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
          {!live && !handover && <div className={`${styles.chips} flex gap-1.5 overflow-x-auto px-4 pb-2.5`}>{QUICK.map((q, i) => <button key={q} onClick={() => send(q)} className={`${styles.glass} ${styles.pill}`} style={{ '--i': i } as React.CSSProperties}>{q}</button>)}</div>}
          <div className="flex items-center gap-2 px-3 pb-3">
            <form onSubmit={e => { e.preventDefault(); send(text); }} className={`${styles.glass} ${styles.composer}`}>
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <input id="chat-input" value={text} onChange={e => setText(e.target.value)} placeholder="Ask anything" className="min-h-11 min-w-0 flex-1 bg-transparent pl-4 text-[15px] text-white placeholder:text-white/55 focus:outline-none" maxLength={600} autoComplete="off" />
              <button className={styles.send} data-ready={!!text.trim() && !busy} disabled={busy || !text.trim()} aria-label="Send"><Icon name="arrow" className="size-[18px]" strokeWidth={2.2} /></button>
            </form>
            {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi DVINE H2O, I have a question.')}`} target="_blank" rel="noopener noreferrer" aria-label="Continue on WhatsApp" className={`${styles.glass} ${styles.round} ${styles.wa}`}><Icon name="whatsapp" className="size-[18px]" /></a>}
          </div>
        </div>
      <button onClick={() => setOpen(true)} className={styles.launcher} aria-label="Chat with us" aria-expanded={open} tabIndex={open ? -1 : 0}>
        <svg viewBox="0 0 48 48" className={styles.icon} aria-hidden="true">
          <defs>
            <linearGradient id="chat-bubble" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#EEF4FF" />
              <stop offset="100%" stopColor="#C9DCF7" />
            </linearGradient>
          </defs>
          <path fill="url(#chat-bubble)" d="M16 4H32C38.6 4 44 9.4 44 16V28C44 31.6 42.8 34.8 40.8 37.3L42.6 42.4C43.1 43.8 41.7 45.1 40.3 44.4L34.6 41.3C33.8 41.4 32.9 41.5 32 41.5H16C9.4 41.5 4 36.1 4 29.5V16C4 9.4 9.4 4 16 4Z" />
          <g className={`${styles.lines} stroke-deep-current`} strokeWidth="3.4" strokeLinecap="round">
            <line x1="14" y1="17" x2="32" y2="17" />
            <line x1="14" y1="25" x2="23" y2="25" />
          </g>
          <g className={`${styles.sparkles} fill-deep-current`}>
            <path className={styles.starBig} d={star(19, 21, 9.5)} />
            <path className={styles.starSmall} d={star(31.5, 28, 5.5)} />
          </g>
        </svg>
      </button>
    </div>
  );
}
