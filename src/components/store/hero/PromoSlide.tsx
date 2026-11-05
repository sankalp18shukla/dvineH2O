'use client';
/* eslint-disable @next/next/no-img-element -- promotion media may be any hosted URL */
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { THEMES, type PromoSlide as P } from '@/lib/site-content';
import { Icon } from '@/components/ui/Icon';
import { DecorLayer } from '../DecorLayer';
import h from './Hero.module.css';
import s from './Promo.module.css';

/** The hero's brush squiggle, set behind side media as it is behind the products. */
const SQUIGGLE = 'M150 22c22-14 44 2 36 22-9 22-48 18-70 4-26-16-60-14-80 8-24 26-8 62 26 64 34 2 52-26 82-26 40 0 66 30 58 62-7 30-46 40-70 22-20-15-6-44 22-42 34 2 58 40 48 92';

/**
 * A promotion slide in the home hero, added in Admin › Homepage & promotions. It shares the product slides'
 * type, descriptor block and buttons (same entrance and exit), with the team's own photo or video either
 * filling the card behind the copy (cover) or standing on the right where the products stand (side).
 */
export function PromoSlide({ p, cls, active, leaving, label }: { p: P; cls: string; active: boolean; leaving: boolean; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const t = THEMES[p.theme] ?? THEMES.volt;
  useEffect(() => {
    const v = video.current; if (!v) return;
    if (active && !matchMedia('(prefers-reduced-motion: reduce)').matches) v.play().catch(() => {}); else v.pause();
  }, [active]);

  const words = p.tag.trim().split(/\s+/).filter(Boolean);
  const lines = p.title.split('\n');
  // the name is sized like the product names (--em = "Crystal"), and shrinks for longer titles
  const em = Math.max(2.44, Math.max(...lines.map(l => l.length)) * 0.37);
  const ctas = [p.primary, p.secondary].filter(c => c.label && c.href);
  const m = p.media?.src ? p.media : null;

  return (
    <article data-slide data-promo className={`${h.slide} ${s.promo} ${p.fit === 'side' ? s.side : s.cover} ${active ? s.on : leaving ? s.off : ''} ${cls}`} aria-roledescription="slide" aria-label={label} aria-hidden={!active}
      style={{ ['--accent' as string]: t.accent, ['--tag-bg' as string]: t.bg, ['--tag-fg' as string]: t.fg, ['--tag-em' as string]: t.em, ['--shade' as string]: p.shade / 100, ['--em' as string]: em }}>
      {/* "behind the text" decorations sit behind a side product too, but over a full-background photo */}
      {p.fit === 'side' && <DecorLayer items={p.decor} layer="back" play={active} out={leaving} />}
      {m && (
        <div className={s.media} aria-hidden={!m.alt || undefined}>
          {p.fit === 'side' && <svg className={s.sq} viewBox="-20 -20 300 280" fill="none" aria-hidden="true"><path d={SQUIGGLE} stroke={t.em === '#046FED' ? t.bg : t.em} strokeWidth="11" strokeLinecap="round" /></svg>}
          {m.type === 'video'
            ? <video ref={video} className={s.el} src={m.src} poster={m.poster || undefined} muted loop playsInline preload={active ? 'auto' : 'metadata'} disablePictureInPicture tabIndex={-1} />
            : <img className={s.el} src={m.src} alt={m.alt} decoding="async" fetchPriority={active ? 'high' : 'low'} />}
          {p.fit === 'cover' && <span className={s.shade} />}
        </div>
      )}
      {p.fit !== 'side' && <DecorLayer items={p.decor} layer="back" play={active} out={leaving} />}
      <div className={h.copy}>
        <h2 className={h.head}>
          {words.length > 0 && (
            <span className={`${h.desc} ${h.f}`} style={{ ['--i' as string]: 0 }}><i /><span className={h.tag}>
              {words.slice(0, -1).map((w, k) => <span key={k}>{w}</span>)}<em>{words[words.length - 1]}</em>
            </span><i /></span>
          )}
          {p.title && <span className={`${h.name} ${s.name} ${h.f}`} style={{ ['--i' as string]: 1 }}>{p.title}</span>}
        </h2>
        <div className={h.body}>
          {p.body && <p className={`${h.lede} ${h.f}`} style={{ ['--i' as string]: 2 }}>{p.body}</p>}
          {ctas.length > 0 && (
            <div className={`${h.ctas} ${h.f}`} style={{ ['--i' as string]: 3 }}>
              {ctas.map((c, k) => (
                <Link key={k} href={c.href} tabIndex={active ? 0 : -1} className={`${h.cta} ${k === 0 ? h.primary : `${h.ghost} glare`}`}>
                  {k === 0 && <span className={h.chip} aria-hidden="true"><Icon name="arrow" /></span>}
                  <span>{c.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <DecorLayer items={p.decor} layer="front" play={active} out={leaving} />
    </article>
  );
}
