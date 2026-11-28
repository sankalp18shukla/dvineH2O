import Image from 'next/image';
import { SectionHead } from '../ui/Section';
import css from './Benefits.module.css';

export type Benefit = { title: string; body: string; tag: string; image: string; alt: string };
type Tone = 'glacier' | 'flash' | 'volt' | 'blue';
const PIN: Record<Tone, string> = { flash: 'var(--color-flash)', glacier: 'var(--color-glacier)', volt: 'var(--color-voltage)', blue: 'var(--color-flash)' };
/** each column drifts at its own pace, as Hyper's everyday photos */
const SPEED = ['.22', '-.16', '.1'];

/**
 * Six benefits (website update brief), set as the site's photo cards: a pin-framed 4:5 photo with the title on a
 * Garamond tag tucked over its bottom edge, then how we know it and the line. Three across on desktop with the
 * middle column dropped and every column drifting at its own pace, two across on tablets, a sideways swipe row on
 * phones (no snapping). Each card fades up 60 ms after the last; reduced motion shows them at once. `note` is the
 * in-house test line under the grid.
 */
export function Benefits({ id, title, body, cards, note, tone = 'flash' }: { id: string; title: string; body?: string; cards: Benefit[]; note?: React.ReactNode; tone?: Tone }) {
  return (
    <section className={`section ${css.section}`} aria-labelledby={id}>
      <div className="container-x">
        <SectionHead id={id} tone={tone === 'flash' ? 'blue' : tone} title={title} body={body} />
        <ul className={css.grid} aria-label="Benefits">
          {cards.map((c, i) => (
            <li key={c.title} className={css.item} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
              <div className={css.card} data-speed={SPEED[i % 3]}>
                <div className="pin-frame relative aspect-[4/5]" style={{ ['--pin' as string]: PIN[tone] }}>
                  <div className="absolute inset-0 overflow-hidden">
                    <Image src={c.image} alt={c.alt} fill sizes="(min-width:1024px) 400px, (min-width:640px) 46vw, 76vw" className={css.photo} />
                  </div>
                </div>
                <span className={css.tag}><h3 className="tag-box no-pins">{c.title}</h3></span>
                <p className={css.how}><span className={css.n}>{String(i + 1).padStart(2, '0')}</span><span className={css.sq} aria-hidden="true" />{c.tag}</p>
                <p className={css.body}>{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        {note && <p className={css.note}><span className={css.sq} aria-hidden="true" />{note}</p>}
      </div>
    </section>
  );
}
