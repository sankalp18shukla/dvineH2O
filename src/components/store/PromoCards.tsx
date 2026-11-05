/* eslint-disable @next/next/no-img-element -- promotion media may be any hosted URL */
import Link from 'next/link';
import { THEMES, themeVars, type PromoCard, type SiteContent } from '@/lib/site-content';
import { LabelBox, Lockup, Squiggle } from '@/components/ui/Brand';
import { Icon } from '@/components/ui/Icon';
import { AutoVideo } from './AutoVideo';
import { DecorLayer } from './DecorLayer';
import s from './PromoCards.module.css';

function Media({ c }: { c: PromoCard }) {
  const m = c.media;
  if (!m?.src) return <div className={`${s.media} ${s.empty}`} aria-hidden="true"><div className="wave-lines-blue absolute inset-0 opacity-60" /></div>;
  return (
    <div className={s.media}>
      {m.type === 'video' ? <AutoVideo src={m.src} poster={m.poster} className={s.el} label={m.alt || undefined} /> : <img src={m.src} alt={m.alt} className={s.el} loading="lazy" decoding="async" />}
    </div>
  );
}

function Card({ c, wide, i }: { c: PromoCard; wide: boolean; i: number }) {
  const t = THEMES[c.theme] ?? THEMES.volt;
  const body = (
    <div className={s.copy}>
      <Squiggle className={s.squiggle} />
      {c.tag && <LabelBox tone={t.dark ? 'volt' : 'blue'} className={s.tag}>{c.tag}</LabelBox>}
      {c.title && <h3 className={s.title}>{c.title}</h3>}
      {c.body && <p className={s.body}>{c.body}</p>}
      {c.cta.label && c.cta.href && <span className={s.cta}>{c.cta.label}<Icon name="arrow" className="size-4" /></span>}
    </div>
  );
  const inner = <><DecorLayer items={c.decor} layer="back" />{body}<Media c={c} /><DecorLayer items={c.decor} layer="front" /></>;
  const cls = `pin-frame ${s.card} ${wide ? s.wide : ''} ${t.dark ? 'on-dark' : ''}`;
  const style = { ...themeVars(c.theme), ['--pin' as string]: t.dark ? t.bg : t.em, transitionDelay: `${i * 90}ms` };
  return c.cta.href
    ? <Link href={c.cta.href} className={cls} style={style} data-reveal aria-label={c.cta.label ? `${c.title || c.tag}: ${c.cta.label}` : undefined}>{inner}</Link>
    : <article className={cls} style={style} data-reveal>{inner}</article>;
}

/**
 * Optional promotion block straight after the hero (Admin › Homepage & promotions): one wide banner, or two
 * or three cards side by side. Each card is a brand-colour block in a pinned frame (the frame opens with the
 * scroll, PinFrames.tsx) with its photo or video, a pinned label, the title and a call to action.
 */
export function PromoCards({ promo, cards }: { promo: SiteContent['promo']; cards: PromoCard[] }) {
  if (!cards.length) return null;
  const wide = cards.length === 1;
  return (
    <section className={`frame-x ${s.section}`} aria-labelledby={promo.title ? 'promo-title' : undefined} aria-label={promo.title ? undefined : 'Offers'}>
      {(promo.title || promo.body) && (
        <div className={s.head} data-reveal>
          {promo.title && <Lockup id="promo-title" title={promo.title} tone="flash" size="md" />}
          {promo.body && <p className="lede max-w-xl">{promo.body}</p>}
        </div>
      )}
      <div className={`${s.grid} ${s[`n${cards.length}`]}`}>
        {cards.map((c, i) => <Card key={c.id} c={c} wide={wide} i={i} />)}
      </div>
    </section>
  );
}
