import type { DecorItem } from '@/lib/site-content';
import { DecorVisual, selfAnimated } from './DecorArt';
import s from './DecorLayer.module.css';

/**
 * Festive decorations (Admin › Homepage & promotions): PNG stickers placed over a hero slide or a promotion card,
 * behind the copy ("back") or over it ("front"), each with a gentle loop. They pop in one after another when
 * `play` is set (the slide becomes active). Built-in Diwali art is drawn (DecorArt.tsx). Everything is clipped to
 * the slide or card, so nothing hangs outside the box. They are decorative, so hidden from assistive tech and the pointer.
 */
export function DecorLayer({ items, layer, play = true, out = false, className = '' }: { items: DecorItem[]; layer: 'front' | 'back'; play?: boolean; out?: boolean; className?: string }) {
  const list = items.filter(d => d.layer === layer && d.src);
  if (!list.length) return null;
  return (
    <div className={`${s.layer} ${s[layer]} ${play ? s.play : ''} ${out ? s.out : ''} ${className}`} aria-hidden="true">
      {list.map((d, i) => (
        <span key={d.id} className={`${s.item} ${d.mobile ? '' : s.desk}`}
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, ['--o' as string]: d.opacity, ['--r' as string]: `${d.rotate}deg`, ['--d' as string]: `${300 + i * 90}ms`, ['--p' as string]: `${(i * 0.7) % 3}s` }}>
          <DecorVisual src={d.src} className={selfAnimated(d.src) ? '' : s[d.motion]} />
        </span>
      ))}
    </div>
  );
}
