'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Faq as F, FaqGroup } from '@/lib/content';
import { Icon } from './Icon';

/**
 * One row. A real <details>, so it works without JavaScript; with it, the answer slides open and shut (its row
 * height eases from 0fr to 1fr while the line fades) instead of snapping. Reduced motion toggles at once.
 * (No ScrollTrigger.refresh() after: re-measuring replays the scrubbed headline and jolts the section.)
 */
function Item({ f, dark, level: H = 'h3' }: { f: F; dark: boolean; level?: 'h3' | 'h4' }) {
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
    <details ref={ref} id={f.id} onToggle={onToggle} data-open={open}
      className={`group self-start border-t ${dark ? 'border-white/20' : 'border-ink/15'} [&_summary::-webkit-details-marker]:hidden`}>
      <summary onClick={toggle} className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 font-sans">
        <H className="text-[17px] font-semibold">{f.q}</H>
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center bg-voltage text-ink transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-data-[open=true]:rotate-45 [html:not(.js)_&]:group-open:rotate-45"><Icon name="plus" className="size-4" /></span>
      </summary>
      <div onTransitionEnd={onEnd} className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
        style={ready ? { gridTemplateRows: open ? '1fr' : '0fr' } : undefined}>
        <div className="min-h-0 overflow-hidden">
          <div className={`-mt-1 pb-6 pr-4 transition-[opacity,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:pr-12 ${ready && !open ? '-translate-y-1.5 opacity-0' : ''} ${dark ? 'text-white/75' : 'text-muted'}`}>
            <p>{f.a}</p>
            {!!f.list?.length && <ul className="mt-3 grid list-disc gap-2 pl-5 marker:text-deep-current">{f.list.map(x => <li key={x}>{x}</li>)}</ul>}
            {!!f.links?.length && (
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-sans text-[14.5px] font-semibold">
                {f.links.map(l => <Link key={l.href} href={l.href} className={`underline underline-offset-4 ${dark ? 'text-white' : 'text-ink'}`}>{l.label}</Link>)}
              </p>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}

/** Accessible accordion built on <details>, works without JavaScript. Ruled rows with a Voltage toggle, as the home fact rows and steps. */
export function Faq({ items, dark = false, single = false, level }: { items: F[]; dark?: boolean; single?: boolean; level?: 'h3' | 'h4' }) {
  return (
    <div className={`grid grid-cols-1 gap-x-12 ${single ? '' : 'md:grid-cols-2'}`}>
      {items.map(f => <Item key={f.q} f={f} dark={dark} level={level} />)}
    </div>
  );
}

/** Grouped FAQs (product pages): a small heading per group over its own accordion. Pair with faqJsonLd for search. */
export function FaqGroups({ groups }: { groups: FaqGroup[] }) {
  return (
    <div className="grid gap-12">
      {groups.map((g, i) => (
        <div key={g.title}>
          <h3 className="mb-3 flex items-baseline gap-4 font-serif text-[26px] leading-tight italic text-deep-current sm:text-[32px]">
            <span className="grid size-8 shrink-0 translate-y-[-3px] place-items-center self-center bg-voltage font-sans text-[13px] font-bold not-italic text-ink">{String(i + 1).padStart(2, '0')}</span>
            {g.title}
            <span className="ml-1 font-sans text-[13px] font-semibold not-italic tracking-[0.14em] text-muted uppercase">{g.items.length} questions</span>
          </h3>
          <Faq items={g.items} level="h4" />
        </div>
      ))}
    </div>
  );
}
