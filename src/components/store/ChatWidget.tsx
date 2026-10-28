'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../ui/Icon';
import styles from './ChatWidget.module.css';

type Msg = { from: 'user' | 'bot' | 'agent'; text: string; at: string; links?: { href: string; label: string }[] };
const KEY = 'dvine_chat';
const hello: Msg = { from: 'bot', text: 'Hi, I’m the DVINE assistant. Ask about products, delivery, installation, water testing or an order.', at: '' };
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
      <div role="dialog" aria-label="Chat with DVINE H2O" aria-hidden={!open} inert={!open} className={`${styles.panel} flex h-[min(560px,calc(100svh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_80px_-20px_rgba(4,22,74,.45)]`}>
          <div className="stage on-dark flex items-center gap-3 px-5 py-4">
            <span className="grid size-9 place-items-center rounded-full bg-glacier text-ink"><Icon name="drop" className="size-5" /></span>
            <div className="flex-1"><p className="font-semibold">DVINE H2O</p><p className="text-[12px] text-white/70">{live ? `Connected to our team · ${live.ref}` : 'Assistant · usually replies instantly'}</p></div>
            <button className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close chat" onClick={() => setOpen(false)}><Icon name="close" /></button>
          </div>
          <div ref={list} className="flex-1 space-y-3 overflow-y-auto bg-paper p-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-snug ${m.from === 'user' ? 'rounded-br-md bg-deep-current text-white' : m.from === 'agent' ? 'rounded-bl-md bg-[#E8E4FF] text-ink' : 'rounded-bl-md bg-white text-ink shadow-sm'}`}>
                  {m.from === 'agent' && <p className="mb-0.5 text-[11px] font-semibold text-[#3A1DB3]">DVINE team</p>}
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.links && <div className="mt-2 flex flex-wrap gap-1.5">{m.links.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-full bg-paper px-3 py-1 text-[12.5px] font-semibold text-deep-current hover:bg-fog">{l.label}</Link>)}</div>}
                </div>
              </div>
            ))}
            {handover && (
              <form onSubmit={startLive} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[14px] font-semibold">Share your details and our team will reply here.</p>
                <label className="sr-only" htmlFor="chat-name">Name</label>
                <input id="chat-name" className="input min-h-11 text-[15px]" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, error: '' }))} required minLength={2} />
                <label className="sr-only" htmlFor="chat-phone">Mobile number</label>
                <input id="chat-phone" className="input min-h-11 text-[15px]" placeholder="Mobile number" inputMode="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value, error: '' }))} required />
                {form.error && <p className="error-text">{form.error}</p>}
                <p className="text-[12px] text-muted">By continuing you agree to our <Link href="/policies/privacy" className="underline">privacy policy</Link>.</p>
                <div className="flex gap-2"><button className="btn btn-primary btn-sm" disabled={busy}>Connect me</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setHandover(false)}>Cancel</button></div>
              </form>
            )}
          </div>
          {!live && !handover && <div className="flex gap-1.5 overflow-x-auto border-t border-line px-3 py-2">{QUICK.map(q => <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12.5px] font-medium hover:border-deep-current">{q}</button>)}</div>}
          <form onSubmit={e => { e.preventDefault(); send(text); }} className="flex items-center gap-2 border-t border-line p-3">
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <input id="chat-input" value={text} onChange={e => setText(e.target.value)} placeholder="Type your question" className="input min-h-11 flex-1 text-[15px]" maxLength={600} autoComplete="off" />
            <button className="grid size-11 place-items-center rounded-full bg-deep-current text-white disabled:opacity-50" disabled={busy || !text.trim()} aria-label="Send"><Icon name="arrow" className="size-5" /></button>
          </form>
          {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi DVINE H2O, I have a question.')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border-t border-line py-2.5 text-[13px] font-semibold text-[#0B7A3E] hover:bg-paper"><Icon name="whatsapp" className="size-4" /> Continue on WhatsApp</a>}
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
