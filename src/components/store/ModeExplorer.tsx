'use client';
import { useState, type ReactNode } from 'react';
import { Lockup } from '@/components/ui/Brand';
import { WaveBand } from './WaveBand';

export function ModeExplorer({ title, items, note, children }: { title: string; items: { key: string; title: string; body: string; color: string }[]; note: string; children?: ReactNode }) {
  const [i, setI] = useState(2);
  const m = items[i];
  return (
    <section id="modes" className="on-dark section relative overflow-hidden py-28 text-white sm:py-40" aria-labelledby="modes-title">
      <WaveBand />
      <div className="pointer-events-none absolute inset-0 transition-[background] duration-700" style={{ background: `radial-gradient(40% 60% at 70% 50%, ${m.color}33, transparent 70%)` }} aria-hidden="true" />
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Lockup id="modes-title" title={title} tone="glacier" size="md" />
          <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Water modes">
            {items.map((it, k) => (
              <button key={it.key} role="tab" aria-selected={k === i} aria-controls="mode-panel" onClick={() => setI(k)}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-5 font-sans text-[15px] font-semibold transition ${k === i ? 'border-white bg-white text-ink' : 'border-white/25 text-white/80 hover:border-white/60'}`}>
                <span className="size-2.5 rounded-full" style={{ background: it.color, boxShadow: `0 0 10px ${it.color}` }} />{it.title}
              </button>
            ))}
          </div>
          <div id="mode-panel" role="tabpanel" className="mt-8 min-h-24" aria-live="polite">
            <p className="font-serif text-3xl italic">{m.title}</p>
            <p className="lede mt-2">{m.body}</p>
          </div>
          <p className="mt-6 max-w-md border-l-2 border-voltage pl-4 font-sans text-sm text-white/80">{note}</p>
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
          {items.map((it, k) => {
            const a = (k / items.length) * Math.PI * 2 - Math.PI / 2;
            return <span key={it.key} className="absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-700" style={{ left: `${50 + Math.cos(a) * 38}%`, top: `${50 + Math.sin(a) * 38}%`, background: it.color, opacity: k === i ? 1 : 0.25, transform: `translate(-50%,-50%) scale(${k === i ? 1.25 : 0.8})`, boxShadow: k === i ? `0 0 60px ${it.color}` : 'none' }} />;
          })}
          <div className="absolute inset-[22%] grid place-items-center rounded-full border border-white/20 bg-white/5 backdrop-blur"><span className="font-sans text-5xl font-bold">0{i + 1}</span></div>
        </div>
      </div>
    </section>
  );
}
