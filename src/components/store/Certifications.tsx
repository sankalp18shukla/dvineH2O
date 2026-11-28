'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Lockup } from '../ui/Brand';
import { Icon } from '../ui/Icon';
import { WaveBand } from './WaveBand';
import bands from './Bands.module.css';
import css from './Certifications.module.css';

export type Cert = { key: string; scale: number; name: string; short: string; logo: string; w: number; covers: string; number: string; issuer: string; valid: string; models: string; file?: string };

/**
 * "Built to be trusted." on the deep wave band (its lines knot and follow the pointer): one ruled row of the marks,
 * each in its own cell with its name under it, as the home fact rows. Marks sit pale until hovered or chosen, then
 * take Glacier and their cell's rule draws Voltage. Choosing one opens a pin-framed panel under the row: what it
 * covers, the certificate number, issuer, validity and scope (rows DVINE hasn't sent yet are left out), and a link to
 * the certificate itself where we have a copy. Tap,
 * click and keyboard all work; Esc, a second press or a tap elsewhere closes it.
 */
export function Certifications({ title, body, items, id = 'certifications', className = bands.bandPad }: { title: string; body?: string; items: Cert[]; id?: string; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const uid = useId();
  const root = useRef<HTMLElement>(null);
  // the row and its panel: a press inside them is handled by their own buttons, a press anywhere else closes the panel
  const wrap = useRef<HTMLDivElement>(null);
  const cur = items.find(c => c.key === open);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { root.current?.querySelector<HTMLButtonElement>(`[data-cert="${open}"]`)?.focus(); setOpen(null); } };
    const away = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('keydown', esc); document.addEventListener('pointerdown', away);
    return () => { document.removeEventListener('keydown', esc); document.removeEventListener('pointerdown', away); };
  }, [open]);

  const rows = cur ? ([['Certificate number', cur.number], ['Issued by', cur.issuer], ['Valid until', cur.valid], ['Applies to', cur.models]] as const).filter(r => r[1]) : [];

  return (
    <section ref={root} id={id} className={`on-dark relative overflow-clip text-white ${className}`} aria-labelledby={`${uid}-t`}>
      <WaveBand interactive knot />
      <span className={bands.scrim} aria-hidden="true" />
      <div className="container-x relative">
        <div className="mb-14 grid grid-cols-1 gap-8 sm:mb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-16" data-reveal>
          <Lockup id={`${uid}-t`} title={title} tone="glacier" />
          {body && <p className="lede max-w-md lg:justify-self-end">{body}</p>}
        </div>
        <div ref={wrap}>
          <ul className={css.row} style={{ ['--n' as string]: items.length }} data-rise>
            {items.map(c => (
              <li key={c.key} className={css.cell}>
                <button type="button" data-cert={c.key} className={`${css.mark} ${open === c.key ? css.on : ''}`} aria-expanded={open === c.key} aria-controls={`${uid}-panel`}
                  onClick={() => setOpen(o => (o === c.key ? null : c.key))}>
                  <span className={css.logo} style={{ ['--src' as string]: `url(${c.logo})`, ['--s' as string]: c.scale, aspectRatio: `${c.w} / 160` }} aria-hidden="true" />
                  <span className={css.name}>{c.name}</span>
                  <span className={css.short}>{c.short}</span>
                  <span className={css.plus} aria-hidden="true"><Icon name="plus" className="size-3.5" /></span>
                </button>
              </li>
            ))}
          </ul>
          <div id={`${uid}-panel`} data-own-motion className={`${css.panel} ${cur ? css.shown : ''}`} role="region" aria-live="polite" aria-label={cur ? cur.name : 'Certification details'}>
            <div>
              {cur && (
                <div className="pin-frame mt-10" style={{ ['--pin' as string]: 'var(--color-voltage)' }}>
                  <div className={`${css.card} relative grid grid-cols-1 gap-8 bg-white p-6 text-ink sm:p-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12`}>
                    <span className={css.big} style={{ ['--src' as string]: `url(${cur.logo})`, aspectRatio: `${cur.w} / 160` }} aria-hidden="true" />
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-sans text-[24px] font-bold tracking-[-0.03em] sm:text-[28px]">{cur.name}</h3>
                        <button type="button" className={css.close} onClick={() => setOpen(null)} aria-label="Close"><Icon name="close" className="size-4" /></button>
                      </div>
                      <p className="mt-3 max-w-2xl text-[18px] leading-snug text-ink/80">{cur.covers}</p>
                      {rows.length > 0 && (
                        <dl className="facts is-2 mt-6">
                          {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                        </dl>
                      )}
                      {cur.file
                        ? <a href={cur.file} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 font-sans text-[15px] font-semibold text-ink underline underline-offset-4">View the certificate <Icon name="arrow" className="size-4" /></a>
                        : <p className="mt-6 font-sans text-[14px] text-muted">Want a copy of the certificate? <Link href="/support#ask" className="font-semibold text-ink underline underline-offset-4">Ask us</Link>.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
