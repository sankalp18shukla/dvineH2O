'use client';
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY } from '@/lib/glossary';
import css from './Term.module.css';

type Entry = { term: string; def: string };
const ENTRIES: Entry[] = GLOSSARY.flatMap(g => [g, ...(g.also ?? []).map(a => ({ term: a, def: g.def }))]);
const find = (t: string) => ENTRIES.find(e => e.term.toLowerCase() === t.toLowerCase());

/** Longest first, so "Total hardness" wins over "Hardness"; whole words only, so "Lead" never matches inside "Leading". */
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERN = new RegExp(`(?<![\\p{L}\\p{N}])(${[...ENTRIES].sort((a, b) => b.term.length - a.term.length).map(e => esc(e.term)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

/**
 * A water-test term with its one-line definition (website update brief): a dotted underline that opens a small
 * panel on hover, on keyboard focus and on tap (phones have no hover); Esc or a second tap closes it. The
 * definition is real text tied to the term with aria-describedby, never a title attribute. The panel lives in
 * <body> (a portal), fixed to the screen, so neither a scrolling table nor an animated parent can clip or move it; it sits above the term (below near the top of the screen) and
 * stays inside the screen edges on narrow phones.
 */
export function Term({ children, k, dark = false }: { children: React.ReactNode; k?: string; dark?: boolean }) {
  const e = find(k ?? String(children));
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const t = tip.current, b = btn.current;
    if (!t || !b) return;
    const r = b.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight, pad = 12;
    const x = Math.min(Math.max(r.left + r.width / 2, pad + w / 2), innerWidth - pad - w / 2);
    const below = r.top < h + 20;
    t.style.left = `${x}px`;
    t.style.top = `${below ? r.bottom + 10 : r.top - 10}px`;
    t.dataset.below = below ? '1' : '';
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const shut = () => { setOpen(false); setPinned(false); };
    const key = (ev: KeyboardEvent) => { if (ev.key === 'Escape') shut(); };
    const away = (ev: PointerEvent) => { if (!wrap.current?.contains(ev.target as Node)) shut(); };
    document.addEventListener('keydown', key); document.addEventListener('pointerdown', away);
    addEventListener('scroll', place, { passive: true, capture: true }); addEventListener('resize', place);
    return () => {
      document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', away);
      removeEventListener('scroll', place, { capture: true }); removeEventListener('resize', place);
    };
  }, [open, place]);

  if (!e) return <>{children}</>;
  return (
    <span ref={wrap} className={`${css.wrap} ${dark ? css.dark : ''}`}
      onMouseEnter={() => matchMedia('(hover: hover)').matches && setOpen(true)}
      onMouseLeave={() => !pinned && setOpen(false)}>
      <button ref={btn} type="button" className={css.term} aria-describedby={id} aria-expanded={open}
        onFocus={() => setOpen(true)} onBlur={() => !pinned && setOpen(false)}
        onClick={ev => { ev.preventDefault(); ev.stopPropagation(); const next = !(open && pinned); setPinned(next); setOpen(next); }}>
        {children}
      </button>
      {(() => {
        const panel = <span ref={tip} id={id} role="tooltip" className={`${css.tip} ${dark ? css.tipDark : ''} ${open ? css.open : ''}`}>{e.def}</span>;
        return mounted ? createPortal(panel, document.body) : panel;
      })()}
    </span>
  );
}

/** Text with every glossary term in it wrapped in a Term (report columns, units, parameter lists). */
export function Gloss({ text, dark = false }: { text: string; dark?: boolean }) {
  const parts = text.split(PATTERN);
  return <>{parts.map((p, i) => (i % 2 ? <Term key={i} k={p} dark={dark}>{p}</Term> : <Fragment key={i}>{p}</Fragment>))}</>;
}
