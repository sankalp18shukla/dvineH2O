import type { Faq as F } from '@/lib/content';
import { Icon } from './Icon';

/** Accessible accordion built on <details>, works without JavaScript. Ruled rows with a Voltage toggle, as the home fact rows and steps. */
export function Faq({ items, dark = false, single = false }: { items: F[]; dark?: boolean; single?: boolean }) {
  return (
    <div className={`grid gap-x-12 ${single ? '' : 'md:grid-cols-2'}`}>
      {items.map(f => (
        <details key={f.q} className={`group self-start border-t ${dark ? 'border-white/20' : 'border-ink/15'} [&_summary::-webkit-details-marker]:hidden`}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 font-sans">
            <h3 className="text-[17px] font-semibold">{f.q}</h3>
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center bg-voltage text-ink transition group-open:rotate-45"><Icon name="plus" className="size-4" /></span>
          </summary>
          <p className={`-mt-1 pb-6 pr-12 ${dark ? 'text-white/75' : 'text-muted'}`}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
