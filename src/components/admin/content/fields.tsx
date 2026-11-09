'use client';
import { useId, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { THEMES, THEME_KEYS, type ThemeKey } from '@/lib/site-content';

/* Small, consistent controls for the content editor. All are controlled: value + onChange. */

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="font-sans text-[13px] font-semibold text-ink">{children}</label>
      {hint && <span className="font-sans text-[12px] text-muted">{hint}</span>}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 font-sans text-[14.5px] text-ink placeholder:text-[#8A95AE] transition focus:border-deep-current focus:ring-4 focus:ring-deep-current/12 focus:outline-none';

export function Text({ label, value, onChange, placeholder, hint, max, className = '', mono = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: ReactNode; max?: number; className?: string; mono?: boolean }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint ?? (max ? `${value.length}/${max}` : undefined)}>{label}</Label>
      <input id={id} value={value} maxLength={max} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={`${inputCls} ${mono ? 'font-mono text-[13px]' : ''}`} />
    </div>
  );
}

export function Area({ label, value, onChange, placeholder, hint, max, rows = 3, className = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: ReactNode; max?: number; rows?: number; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint ?? (max ? `${value.length}/${max}` : undefined)}>{label}</Label>
      <textarea id={id} value={value} maxLength={max} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={`${inputCls} resize-y leading-relaxed`} />
    </div>
  );
}

export function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 font-sans select-none">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-deep-current' : 'bg-[#C9D2E3]'}`}>
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
      <span><span className="block text-[14px] font-semibold text-ink">{label}</span>{sub && <span className="block text-[12.5px] text-muted">{sub}</span>}</span>
    </label>
  );
}

export function Segmented<T extends string>({ label, value, onChange, options }: { label?: string; value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; icon?: string }[] }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-[#EEF1F7] p-1" role="radiogroup">
        {options.map(o => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-[13px] font-semibold transition ${value === o.value ? 'bg-white text-ink shadow-[0_1px_3px_rgb(4_22_74/.15)]' : 'text-muted hover:text-ink'}`}>
            {o.icon && <Icon name={o.icon} className="size-4" />}{o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemePicker({ value, onChange, label = 'Theme' }: { value: ThemeKey; onChange: (v: ThemeKey) => void; label?: string }) {
  return (
    <div>
      <Label hint={THEMES[value]?.label}>{label}</Label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {THEME_KEYS.map(k => {
          const t = THEMES[k];
          return (
            <button key={k} type="button" role="radio" aria-checked={value === k} title={t.label} aria-label={t.label} onClick={() => onChange(k)}
              className={`group relative grid size-10 place-items-center rounded-xl transition ${value === k ? 'ring-2 ring-ink ring-offset-2' : 'ring-1 ring-black/10 hover:scale-105'}`}
              style={{ background: t.bg }}>
              <span className="font-serif text-[17px] italic leading-none" style={{ color: t.em }}>Aa</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Range({ label, value, onChange, min, max, step = 1, format, left, right }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string; left?: string; right?: string }) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} hint={format ? format(value) : value}>{label}</Label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-deep-current" />
      {(left || right) && <div className="flex justify-between font-sans text-[11.5px] text-muted"><span>{left}</span><span>{right}</span></div>}
    </div>
  );
}

export function Schedule({ value, onChange }: { value: { from: string; to: string }; onChange: (v: { from: string; to: string }) => void }) {
  const [open, setOpen] = useState(!!(value.from || value.to));
  const id = useId();
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 font-sans text-[13px] font-semibold text-deep-current hover:underline">
      <Icon name="calendar" className="size-4" />Schedule start and end dates
    </button>
  );
  return (
    <div className="rounded-xl border border-dashed border-line bg-[#F8FAFD] p-3">
      <div className="mb-2 flex items-center justify-between font-sans text-[13px]"><span className="flex items-center gap-2 font-semibold"><Icon name="calendar" className="size-4" />Runs between (India time)</span>
        <button type="button" className="text-muted hover:text-ink" onClick={() => { onChange({ from: '', to: '' }); setOpen(false); }}>Always on</button></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label htmlFor={`${id}f`} className="font-sans text-[12px] text-muted">From</label><input id={`${id}f`} type="date" value={value.from} onChange={e => onChange({ ...value, from: e.target.value })} className={inputCls} /></div>
        <div><label htmlFor={`${id}t`} className="font-sans text-[12px] text-muted">Until</label><input id={`${id}t`} type="date" value={value.to} min={value.from || undefined} onChange={e => onChange({ ...value, to: e.target.value })} className={inputCls} /></div>
      </div>
    </div>
  );
}

/** Button label + link, side by side. Offers the site's main pages as suggestions. */
export function LinkField({ label, value, onChange }: { label: string; value: { label: string; href: string }; onChange: (v: { label: string; href: string }) => void }) {
  const id = useId();
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-[1fr_1.2fr] gap-2">
        <input aria-label={`${label} text`} value={value.label} maxLength={40} placeholder="Button text" onChange={e => onChange({ ...value, label: e.target.value })} className={inputCls} />
        <input aria-label={`${label} link`} list={id} value={value.href} placeholder="/page or https://…" onChange={e => onChange({ ...value, href: e.target.value })} className={`${inputCls} font-mono text-[13px]`} />
      </div>
      <datalist id={id}>{PAGES.map(p => <option key={p.href} value={p.href}>{p.label}</option>)}</datalist>
    </div>
  );
}
export const PAGES = [
  { href: '/home-water-systems', label: 'Crystal' }, { href: '/hydrogen-bottles', label: 'Hyper' }, { href: '/for-business', label: 'Titan / business' },
  { href: '/for-business#bulk', label: 'Bulk and gifting' }, { href: '/water-testing', label: 'Water testing' }, { href: '/water-testing#book', label: 'Book a water test' },
  { href: '/book-demo', label: 'Book a demo' }, { href: '/become-a-partner', label: 'Become a partner' }, { href: '/support', label: 'Support' }, { href: '/support#contact', label: 'Contact' },
];

/** Collapsible card for one item in a list (slide, card, message), with a drag handle and actions. */
export function ItemCard({ title, badge, open, onToggle, actions, children, drag, muted = false }: {
  title: ReactNode; badge?: ReactNode; open: boolean; onToggle: () => void; actions?: ReactNode; children: ReactNode; muted?: boolean;
  drag?: ReturnType<ReturnType<typeof useSortable>['handle']>;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition ${open ? 'border-deep-current/40 shadow-[0_10px_30px_-18px_rgb(4_22_74/.45)]' : 'border-line'} ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {drag && <span {...drag} className="grid size-8 cursor-grab place-items-center rounded-lg text-muted hover:bg-[#EEF1F7] active:cursor-grabbing" aria-label="Drag to reorder" title="Drag to reorder"><Icon name="grip" className="size-4" strokeWidth={2.4} /></span>}
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2.5 text-left font-sans" aria-expanded={open}>
          <Icon name="chevron" className={`size-4 shrink-0 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
          <span className="truncate text-[14.5px] font-semibold">{title}</span>{badge}
        </button>
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      </div>
      {open && <div className="grid gap-4 border-t border-line px-4 py-4 sm:px-5">{children}</div>}
    </div>
  );
}

export function IconBtn({ icon, label, onClick, danger = false, disabled = false }: { icon: string; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label}
      className={`grid size-8 place-items-center rounded-lg transition disabled:opacity-30 ${danger ? 'text-[#B3261E] hover:bg-[#FCE8E6]' : 'text-muted hover:bg-[#EEF1F7] hover:text-ink'}`}>
      <Icon name={icon} className="size-4" />
    </button>
  );
}

export function Pill({ tone = 'gray', children }: { tone?: 'gray' | 'green' | 'blue' | 'amber'; children: ReactNode }) {
  const c = { gray: 'bg-[#EEF1F7] text-muted', green: 'bg-[#E3F5E8] text-[#1B6B2C]', blue: 'bg-[#E4EEFD] text-deep-current', amber: 'bg-[#FFF4D6] text-[#7A5300]' }[tone];
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-sans text-[11.5px] font-semibold ${c}`}>{children}</span>;
}

/**
 * Drag-to-reorder for a list. Rows only become draggable while their handle is held, so text in the
 * row's inputs can still be selected normally.
 */
export function useSortable(count: number, move: (from: number, to: number) => void) {
  const [armed, setArmed] = useState<number | null>(null);
  const [from, setFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const row = (i: number) => ({
    draggable: armed === i,
    onDragStart: (e: React.DragEvent) => { setFrom(i); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); },
    onDragOver: (e: React.DragEvent) => { if (from === null) return; e.preventDefault(); if (over !== i) setOver(i); },
    onDrop: (e: React.DragEvent) => { if (from === null) return; e.preventDefault(); if (from !== i && i < count) move(from, i); setFrom(null); setOver(null); setArmed(null); },
    onDragEnd: () => { setFrom(null); setOver(null); setArmed(null); },
    'data-over': over === i && from !== null && from !== i ? (from < i ? 'after' : 'before') : undefined,
    className: 'relative data-[over=before]:before:absolute data-[over=before]:before:inset-x-0 data-[over=before]:before:-top-1.5 data-[over=before]:before:h-0.5 data-[over=before]:before:rounded data-[over=before]:before:bg-deep-current data-[over=after]:after:absolute data-[over=after]:after:inset-x-0 data-[over=after]:after:-bottom-1.5 data-[over=after]:after:h-0.5 data-[over=after]:after:rounded data-[over=after]:after:bg-deep-current' + (from === i ? ' opacity-40' : ''),
  });
  const handle = (i: number) => ({ onPointerDown: () => setArmed(i), onPointerUp: () => setArmed(null) });
  return { row, handle };
}

export const moveItem = <T,>(list: T[], from: number, to: number) => { const a = [...list]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a; };
