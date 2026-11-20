'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '../ui/Icon';
import { CHAT_OPEN, CHAT_STATE } from './events';
import styles from './ChatWidget.module.css';

type ChatLink = { href: string; label: string };
type Msg = { from: 'user' | 'bot' | 'agent'; text: string; at: string; links?: ChatLink[]; chips?: string[]; handoff?: boolean };
type Ctx = { topic?: 'crystal' | 'hyper' | 'titan'; misses: number; awaiting?: 'pincode' };
/** The conversation is kept for the browser tab (sessionStorage), so a page reload doesn't lose it. */
const KEY = 'dvine_chat_v2';
const hello: Msg = { from: 'bot', text: 'Hi, I’m the DVINE assistant. Ask me about prices and offers, delivery, installation, water testing or an order.', at: '' };
const QUICK = ['Current offers', 'Which one is right for me?', 'Track my order', 'Talk to a person'];
const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// 4-point sparkle star, concave sides
const star = (cx: number, cy: number, r: number) => {
  const k = r * 0.18;
  return `M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`;
};

/** The newest answer types itself out, about as fast as a person reads; then its links and buttons appear. */
function Typed({ text, onDone }: { text: string; onDone: () => void }) {
  const [n, setN] = useState(() => (reduced() ? text.length : 0));
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    if (n >= text.length) { done.current(); return; }
    const step = Math.max(2, Math.ceil(text.length / 55));
    const t = window.setTimeout(() => setN(x => Math.min(text.length, x + step)), 16);
    return () => window.clearTimeout(t);
  }, [n, text]);
  // the rest is laid out but invisible, so the bubble doesn't grow as it types; screen readers get the whole answer once
  return <><span aria-hidden="true">{text.slice(0, n)}<span className="opacity-0">{text.slice(n)}</span></span><span className="sr-only">{text}</span></>;
}

/** The visitor's questions so far, to send with them to WhatsApp so nobody has to repeat themselves. */
function whatsappText(msgs: Msg[], path: string) {
  const asked = msgs.filter(m => m.from === 'user' && !/^(talk to a person|current offers|track my order|which one is right for me\?)$/i.test(m.text)).slice(-3).map(m => m.text);
  return ['Hi DVINE H2O, I was chatting with the assistant on your website' + (path !== '/' ? ` (${path})` : '') + '.', asked.length ? `My question: ${asked.join(' / ')}` : 'I have a question.'].join('\n');
}

/**
 * Chat assistant in the bottom corner (answers from src/lib/chatbot.ts through /api/chat). It answers from a fixed
 * set of topics, with suggestions to tap next; when it can't help, or the visitor asks for a person, it hands over to
 * WhatsApp with their question already written.
 */
export function ChatWidget({ whatsapp }: { whatsapp: string | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([hello]);
  const [ctx, setCtx] = useState<Ctx>({ misses: 0 });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  /** index of the answer still typing itself out */
  const [typing, setTyping] = useState<number | null>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.removeItem('dvine_chat'); // the old leave-your-number chat
      const s = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
      if (Array.isArray(s?.msgs) && s.msgs.length) { setMsgs(s.msgs); setCtx(s.ctx ?? { misses: 0 }); }
    } catch {}
  }, []);
  useEffect(() => { try { if (msgs.length > 1) sessionStorage.setItem(KEY, JSON.stringify({ msgs: msgs.slice(-40), ctx })); } catch {} }, [msgs, ctx]);
  // the phone dock carries its own chat button; it opens this panel and steps aside while it is open
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(CHAT_OPEN, show);
    return () => window.removeEventListener(CHAT_OPEN, show);
  }, []);
  useEffect(() => { window.dispatchEvent(new CustomEvent(CHAT_STATE, { detail: open })); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: reduced() ? 'auto' : 'smooth' }); }, [msgs, open, busy, typing]);

  if (path.startsWith('/checkout/pay')) return null;

  const wa = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText(msgs, path))}` : null;
  const last = msgs[msgs.length - 1];
  const chips = busy || typing !== null ? [] : last.from === 'bot' && last.chips?.length ? last.chips : msgs.length === 1 ? QUICK : [];

  const send = async (raw: string) => {
    const q = raw.trim(); if (!q || busy) return;
    setText(''); setBusy(true); setTyping(null);
    setMsgs(m => [...m, { from: 'user', text: q, at: new Date().toISOString() }]);
    const started = Date.now();
    let reply: Msg; let next = ctx;
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: q, ctx }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      reply = j.reply; next = j.ctx ?? ctx;
    } catch (e) {
      reply = { from: 'bot', text: e instanceof Error && e.message ? e.message : 'I couldn’t connect just now. Please try again, or message our team on WhatsApp.', at: new Date().toISOString(), handoff: true };
    }
    // a short, natural pause while "typing", longer for longer answers
    if (!reduced()) await wait(Math.max(0, Math.min(1300, 450 + reply.text.length * 4) - (Date.now() - started)));
    setCtx(next);
    setTyping(msgs.length + 1); // after the question just added
    setMsgs(m => [...m, reply]);
    setBusy(false);
  };

  const linkPill = (l: ChatLink) => {
    const cls = `${styles.glass} ${styles.pill}`;
    const body = <>{l.label}<Icon name="arrow" className="size-3.5" strokeWidth={2} /></>;
    // offer links apply a code (a route, not a page) and phone links leave the site: plain links
    return l.href.startsWith('/offer/') || !l.href.startsWith('/')
      ? <a key={l.href} href={l.href} className={cls}>{body}</a>
      : <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cls}>{body}</Link>;
  };

  return (
    <div data-open={open} className={`${styles.root} no-print fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom,0px)+var(--action-bar,0px))] z-40 font-sans transition-[bottom] duration-300 sm:right-6 sm:bottom-[calc(24px+var(--action-bar,0px))]`}>
      <div role="dialog" aria-label="Chat with DVINE H2O" aria-hidden={!open} inert={!open} className={`${styles.panel} flex h-[min(600px,calc(100svh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden text-white`}>
          <div className={styles.orbs} aria-hidden="true"><i /><i /><i /></div>
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
            <span className={styles.avatar}><Icon name="drop" className="size-[18px]" strokeWidth={2} /></span>
            <p className="flex-1 text-[14px] font-semibold tracking-tight">DVINE H2O<span className="block text-[11.5px] font-normal text-white/60">Instant answers · our team on WhatsApp</span></p>
            <button className={`${styles.glass} ${styles.round}`} aria-label="Close chat" onClick={() => setOpen(false)}><Icon name="close" className="size-4" strokeWidth={2} /></button>
          </div>
          <div ref={list} className={`${styles.list} flex-1 overflow-y-auto px-4 py-3`} aria-live="polite">
            {msgs.map((m, i) => {
              const mine = m.from === 'user';
              const first = i === 0 || msgs[i - 1].from !== m.from;
              const shown = typing !== i;
              return (
                <div key={i} className={`${styles.msg} flex ${mine ? 'justify-end' : 'justify-start'} ${first ? 'mt-3 first:mt-0' : 'mt-1'}`}>
                  <div className={`${styles.bubble} ${mine ? styles.mine : m.from === 'agent' ? styles.agent : styles.bot}`}>
                    <p className="whitespace-pre-line">{typing === i ? <Typed text={m.text} onDone={() => setTyping(null)} /> : m.text}</p>
                    {shown && m.links && m.links.length > 0 && <div className={`${styles.after} mt-2.5 flex flex-wrap gap-1.5`}>{m.links.map(linkPill)}</div>}
                    {shown && m.handoff && wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className={`${styles.after} ${styles.cta} ${styles.handoff} mt-3`}>
                        <Icon name="whatsapp" className="size-[18px]" />Chat with us on WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            {busy && <div className={`${styles.msg} mt-3 flex`} aria-label="Assistant is typing"><div className={`${styles.bubble} ${styles.bot} ${styles.typing}`}><i /><i /><i /></div></div>}
          </div>
          {chips.length > 0 && <div key={msgs.length} className={`${styles.chips} -mt-1 flex gap-1.5 overflow-x-auto px-4 pt-1 pb-2.5`} aria-label="Suggestions">{chips.map((q, i) => <button key={q} onClick={() => send(q)} className={`${styles.glass} ${styles.pill}`} style={{ '--i': i } as React.CSSProperties}>{q}</button>)}</div>}
          <div className="flex items-center gap-2 px-3 pb-3">
            <form onSubmit={e => { e.preventDefault(); send(text); }} className={`${styles.glass} ${styles.composer}`}>
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <input id="chat-input" value={text} onChange={e => setText(e.target.value)} placeholder="Ask anything" className="min-h-11 min-w-0 flex-1 bg-transparent pl-4 text-[15px] text-white placeholder:text-white/55 focus:outline-none" maxLength={600} autoComplete="off" />
              <button className={styles.send} data-ready={!!text.trim() && !busy} disabled={busy || !text.trim()} aria-label="Send"><Icon name="arrow" className="size-[18px]" strokeWidth={2.2} /></button>
            </form>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat with our team on WhatsApp" title="Chat with our team on WhatsApp" className={`${styles.glass} ${styles.round} ${styles.wa}`}><Icon name="whatsapp" className="size-[18px]" /></a>}
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
