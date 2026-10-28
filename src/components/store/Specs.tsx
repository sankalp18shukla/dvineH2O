import type { Product } from '@/lib/catalog';
import { Icon } from '../ui/Icon';

type Spec = { label: string; value: string };
const Rows = ({ specs }: { specs: Spec[] }) => (
  <>{specs.map(s => (
    <div key={s.label} className="grid grid-cols-[minmax(120px,0.8fr)_1.6fr] gap-4 py-4 pr-2 font-sans text-[15px]">
      <dt className="text-muted">{s.label}</dt><dd className="font-medium">{s.value}</dd>
    </div>
  ))}</>
);

/** Spec table. With `initial`, the rest fold into "View full specifications" (id="full-specs"). */
export function Specs({ p, initial, box = true }: { p: Product; initial?: number; box?: boolean }) {
  const all = p.specs ?? [];
  const head = initial ? all.slice(0, initial) : all;
  const rest = initial ? all.slice(initial) : [];
  return (
    <div className={`grid gap-10 ${box && p.boxContents?.length ? 'lg:grid-cols-[1.4fr_1fr]' : ''}`}>
      <div>
        <dl className="divide-y divide-line border-t-2 border-ink"><Rows specs={head} /></dl>
        {rest.length > 0 && (
          <details id="full-specs" className="group mt-3 scroll-mt-32 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-2 font-sans text-[15px] font-semibold text-deep-current">
              <span className="group-open:hidden">View full specifications</span><span className="hidden group-open:inline">Hide full specifications</span>
              <Icon name="down" className="size-4 transition group-open:rotate-180" />
            </summary>
            <dl className="mt-2 divide-y divide-line border-t border-line"><Rows specs={rest} /></dl>
          </details>
        )}
      </div>
      {box && !!p.boxContents?.length && <BoxContents p={p} />}
    </div>
  );
}

export function BoxContents({ p, className = '' }: { p: Product; className?: string }) {
  if (!p.boxContents?.length) return null;
  return (
    <div className={`border-t-2 border-ink pt-5 ${className}`}>
      <h3 className="flex items-center gap-2 font-sans text-lg font-semibold"><Icon name="box" className="size-5 text-deep-current" /> In the box</h3>
      <ul className="mt-4 grid gap-2.5">
        {p.boxContents.map(b => <li key={b} className="flex items-start gap-3 font-sans text-[15px]"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-deep-current" />{b}</li>)}
      </ul>
      <p className="mt-5 font-sans text-[13px] text-muted">SKU {p.sku}{p.hsn ? ` · HSN ${p.hsn}` : ''}</p>
    </div>
  );
}
