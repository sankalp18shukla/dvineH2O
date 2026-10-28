import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';

export function PageHead({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-ink"><Icon name="arrowLeft" className="size-4" />{back.label}</Link>}
        <h1 className="font-sans text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 font-sans text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex max-w-full flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, sub, href, tone }: { label: string; value: ReactNode; sub?: ReactNode; href?: string; tone?: 'warn' | 'bad' | 'good' }) {
  const t = tone === 'bad' ? 'border-l-[#C2001B]' : tone === 'warn' ? 'border-l-[#E8A600]' : tone === 'good' ? 'border-l-[#1B6B2C]' : 'border-l-transparent';
  const body = (
    <div className={`h-full rounded-2xl border border-line border-l-4 ${t} bg-white p-4 font-sans`}>
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}

export function Panel({ title, children, actions, className = '' }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-white ${className}`}>
      {(title || actions) && <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5"><h2 className="font-sans text-[15px] font-semibold">{title}</h2>{actions}</div>}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center font-sans text-sm text-muted">{children}</p>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-5 -my-5 overflow-x-auto"><table className="table">{children}</table></div>;
}

export const pct = (x: number) => `${(x * 100).toFixed(x > 0 && x < 0.1 ? 1 : 0)}%`;
export const dt = (d?: Date | null) => (d ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
export const day = (d?: Date | null) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** GET filter bar: renders a form that preserves other params. */
export function Filters({ children }: { children: ReactNode }) {
  return <form className="mb-4 flex flex-wrap items-end gap-2 font-sans [&_.input]:min-h-10 [&_.input]:text-sm [&_label]:text-[12px]">{children}<button className="btn btn-outline btn-sm min-h-10">Apply</button></form>;
}
