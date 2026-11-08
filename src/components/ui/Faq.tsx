'use client';
import { useEffect, useRef, useState } from 'react';
import type { Faq as F } from '@/lib/content';
import { Icon } from './Icon';

/**
 * One row. A real <details>, so it works without JavaScript; with it, the answer slides open and shut (its row
 * height eases from 0fr to 1fr while the line fades) instead of snapping. Reduced motion toggles at once.
 * (No ScrollTrigger.refresh() after: re-measuring replays the scrubbed headline and jolts the section.)
 */
function Item({ f, dark }: { f: F; dark: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setReady(true), []);

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const d = ref.current!;
    if (!open) { d.open = true; requestAnimationFrame(() => setOpen(true)); }
    else { setOpen(false); if (reduced()) d.open = false; }
  };
  // a link to the row's id (Reveal.tsx) or find-in-page can open the <details> directly: follow it
  const onToggle = () => { if (ref.current?.open && !open) setOpen(true); };
  const onEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'grid-template-rows') return;
    if (!open && ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} onToggle={onToggle} data-open={open}
      className={`group self-start border-t ${dark ? 'border-white/20' : 'border-ink/15'} [&_summary::-webkit-details-marker]:hidden`}>
      <summary onClick={toggle} className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 font-sans">
        <h3 className="text-[17px] font-semibold">{f.q}</h3>
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center bg-voltage text-ink transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-data-[open=true]:rotate-45 [html:not(.js)_&]:group-open:rotate-45"><Icon name="plus" className="size-4" /></span>
      </summary>
      <div onTransitionEnd={onEnd} className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
        style={ready ? { gridTemplateRows: open ? '1fr' : '0fr' } : undefined}>
        <div className="min-h-0 overflow-hidden">
          <p className={`-mt-1 pb-6 pr-12 transition-[opacity,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${ready && !open ? '-translate-y-1.5 opacity-0' : ''} ${dark ? 'text-white/75' : 'text-muted'}`}>{f.a}</p>
        </div>
      </div>
    </details>
  );
}

/** Accessible accordion built on <details>, works without JavaScript. Ruled rows with a Voltage toggle, as the home fact rows and steps. */
export function Faq({ items, dark = false, single = false }: { items: F[]; dark?: boolean; single?: boolean }) {
  return (
    <div className={`grid gap-x-12 ${single ? '' : 'md:grid-cols-2'}`}>
      {items.map(f => <Item key={f.q} f={f} dark={dark} />)}
    </div>
  );
}
