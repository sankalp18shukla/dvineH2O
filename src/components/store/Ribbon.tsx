import Link from 'next/link';
import { themeVars, type Ribbon as R } from '@/lib/site-content';
import s from './Ribbon.module.css';

const SEP: Record<R['separator'], React.ReactNode> = {
  drop: <svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 1C4 4.5 1.5 7.4 1.5 10.2a4.5 4.5 0 0 0 9 0C10.5 7.4 8 4.5 6 1Z" fill="currentColor" /></svg>,
  star: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0c.6 4.6 2.8 7 8 8-5.2 1-7.4 3.4-8 8-.6-4.6-2.8-7-8-8 5.2-1 7.4-3.4 8-8Z" fill="currentColor" /></svg>,
  dot: <svg viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3" fill="currentColor" /></svg>,
  spark: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v4M8 11v4M1 8h4M11 8h4M3 3l2.5 2.5M10.5 10.5 13 13M13 3l-2.5 2.5M5.5 10.5 3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
};

/**
 * Announcement ribbon above the header: promotion messages scrolling right to left in a brand theme.
 * Two identical tracks loop seamlessly (the second is hidden from assistive tech); hover pauses it,
 * reduced motion shows the messages still. Edited in Admin › Homepage & promotions.
 */
export function Ribbon({ ribbon, preview = false }: { ribbon: R; preview?: boolean }) {
  const items = ribbon.items.map(i => i.text).filter(Boolean);
  if (!items.length) return null;
  // repeat short lists so one track is always wider than the screen
  const reps = Math.max(1, Math.ceil(8 / items.length));
  const list = Array.from({ length: reps }, () => items).flat();
  const track = (hidden: boolean) => (
    <ul className={s.track} aria-hidden={hidden || undefined}>
      {list.map((t, i) => <li key={i} className={s.item}><span>{t}</span><span className={s.sep}>{SEP[ribbon.separator]}</span></li>)}
    </ul>
  );
  const body = (
    <div className={s.marquee} style={{ ['--dur' as string]: `${ribbon.speed}s` }}>
      {track(false)}{track(true)}
    </div>
  );
  const cls = `site-ribbon no-print ${s.ribbon} ${preview ? s.preview : ''}`;
  return ribbon.href
    ? <Link href={ribbon.href} className={cls} style={themeVars(ribbon.theme)} aria-label={`Offers: ${items.join('. ')}`}>{body}</Link>
    : <aside className={cls} style={themeVars(ribbon.theme)} aria-label="Offers">{body}</aside>;
}
