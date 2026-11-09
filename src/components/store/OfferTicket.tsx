'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { THEMES, themeVars, type Offer } from '@/lib/site-content';
import { LabelBox, Squiggle } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import s from './OfferTicket.module.css';

/** The last moment of the run date, in India time (run dates are inclusive, see isLive). */
const endOf = (date: string) => new Date(`${date}T23:59:59.999+05:30`).getTime();
const fmtDate = (date: string) => new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Countdown to the offer's end date. Server and first client render show the plain date ("Ends 15 Nov"), so
 * hydration matches; after mounting it switches to days left, and on the last day to a live clock.
 */
function Countdown({ to }: { to: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = endOf(to);
    let t = 0;
    const tick = () => {
      const ms = end - Date.now();
      setLeft(ms);
      // a live clock only while under a day remains; otherwise check back hourly
      t = window.setTimeout(tick, ms < 864e5 ? 1000 - (Date.now() % 1000) : 36e5);
    };
    tick();
    return () => window.clearTimeout(t);
  }, [to]);

  if (left !== null && left <= 0) return <span>Offer ended</span>;
  if (left === null || left >= 4 * 864e5) return <span>Ends {fmtDate(to)}</span>;
  if (left >= 864e5) { const d = Math.ceil(left / 864e5); return <span>Ends in {d} days</span>; }
  const h = Math.floor(left / 36e5), m = Math.floor(left / 6e4) % 60, sec = Math.floor(left / 1e3) % 60;
  return (
    <span className={s.live}>
      <span className={s.dot} aria-hidden="true" />Last day
      <span className={s.clock} aria-label={`${h} hours ${m} minutes left`}><span aria-hidden="true">{pad(h)}:{pad(m)}:{pad(sec)}</span></span>
    </span>
  );
}

/** Tap to copy the coupon code; it says "Copied" for a moment. */
function Code({ code, hint }: { code: string; hint: string }) {
  const [done, setDone] = useState(false);
  const t = useRef(0);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); }
    catch {
      // older browsers: copy from a hidden field
      const f = Object.assign(document.createElement('textarea'), { value: code });
      f.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(f); f.select();
      try { document.execCommand('copy'); } catch { /* the code is still on screen */ }
      f.remove();
    }
    setDone(true); window.clearTimeout(t.current); t.current = window.setTimeout(() => setDone(false), 1800);
  };
  useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <div className={s.stub}>
      <span className={s.stubLabel}>{hint}</span>
      <button type="button" onClick={copy} className={s.code} data-done={done || undefined} aria-label={`Copy code ${code}`}>
        <span className={s.codeTxt}>{code}</span>
        <span className={s.codeIcon} aria-hidden="true"><Icon name={done ? 'check' : 'copy'} className="size-4" strokeWidth={2} /></span>
      </button>
      <span className="sr-only" aria-live="polite">{done ? `Code ${code} copied` : ''}</span>
    </div>
  );
}

/**
 * Offer ticket in the product's purchase panel (Admin › Homepage & promotions › Product pages). A brand-colour
 * coupon with notched edges and a perforation: the pinned label, the offer, small print and a countdown on the
 * left; the code to copy on the tear-off stub. The stub sits on the right when there is room and below on phones
 * (a container query, so it follows the panel's width rather than the screen's).
 */
export function OfferTicket({ offer, codeHint = 'Use code at cart' }: { offer: Offer; codeHint?: string }) {
  const t = THEMES[offer.theme] ?? THEMES.volt;
  const code = offer.code.trim().toUpperCase();
  const to = offer.countdown && offer.schedule.to ? offer.schedule.to : '';
  const link = offer.link.label && offer.link.href ? offer.link : null;
  return (
    <div className={s.wrap}>
      <div className={`${s.ticket} ${code ? s.hasCode : ''} ${t.dark ? 'on-dark' : ''}`} style={{ ...themeVars(offer.theme), ['--stubW' as string]: `${Math.min(260, Math.max(172, code.length * 15 + 92))}px` }} role="group" aria-label={`Offer: ${offer.tag || offer.title}`}>
        <div className={s.main}>
          <Squiggle className={s.squiggle} />
          {offer.tag && <LabelBox tone={t.dark ? 'volt' : 'blue'} className={s.tag}>{offer.tag}</LabelBox>}
          {offer.title && <p className={s.title}>{offer.title}</p>}
          {offer.body && <p className={s.body}>{offer.body}</p>}
          {(to || link) && (
            <p className={s.meta}>
              {to && <span className={s.when}><Icon name="calendar" className="size-[15px]" strokeWidth={1.8} /><Countdown to={to} /></span>}
              {link && <Link href={link.href} className={s.link}>{link.label}<Icon name="arrow" className="size-3.5" /></Link>}
            </p>
          )}
        </div>
        {code && <Code code={code} hint={codeHint} />}
      </div>
    </div>
  );
}
