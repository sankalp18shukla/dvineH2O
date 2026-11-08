import type { ReactNode } from 'react';
import s from './ReviewMarquee.module.css';

/**
 * Reviews as a strip that moves on continuously, right to left, at an even pace (no stops, no snapping). The set is
 * drawn twice so the loop never shows a gap; the copy is hidden from screen readers and the keyboard. Hovering or
 * focusing a card pauses the strip; under reduced motion it stands still and scrolls sideways by hand instead.
 */
export function ReviewMarquee({ children, label }: { children: ReactNode[]; label: string }) {
  // about 7 s per card keeps a card readable while it crosses the screen
  const style = { ['--dur' as string]: `${Math.max(36, children.length * 7)}s` };
  return (
    <div className={s.marquee} role="region" aria-label={label}>
      <div className={s.track} style={style}>
        <ul className={s.set}>{children.map((c, k) => <li key={k} className={s.item}>{c}</li>)}</ul>
        <ul className={`${s.set} ${s.copy}`} aria-hidden="true" inert>{children.map((c, k) => <li key={k} className={s.item}>{c}</li>)}</ul>
      </div>
    </div>
  );
}
