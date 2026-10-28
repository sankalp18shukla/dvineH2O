import Link from 'next/link';

const STEPS = ['Cart', 'Contact', 'Delivery', 'Payment', 'Confirmation'] as const;

/** Checkout progress: Cart › Contact › Delivery › Payment › Confirmation. */
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-sm text-muted" aria-label="Checkout steps">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden="true" className="text-line">›</span>}
          <span aria-current={i === current ? 'step' : undefined} className={`flex items-center gap-2 ${i === current ? 'font-semibold text-ink' : ''}`}>
            <span className={`grid size-6 place-items-center rounded-full text-[12px] font-semibold ${i < current ? 'bg-deep-current text-white' : i === current ? 'bg-ink text-white' : 'border border-line bg-white'}`}>{i + 1}</span>
            {i === 0 && current > 0 ? <Link href="/cart" className="hover:underline">{s}</Link> : s}
          </span>
        </li>
      ))}
    </ol>
  );
}
