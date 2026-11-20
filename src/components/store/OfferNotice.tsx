'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';

const TEXT: Record<string, (code: string) => string> = {
  applied: code => `${code} is applied. You’ll see the saving in your cart.`,
  ended: code => `Sorry, the ${code} offer has ended.`,
  soon: code => `The ${code} offer hasn’t started yet. Check back soon.`,
  invalid: code => `${code} isn’t a valid code.`,
};

/**
 * After an offer link (/offer/CODE, the ribbon's code) lands a visitor on a page with ?offer=applied:CODE: a short
 * note that the code is on their cart, or why it is not. The note clears the parameter from the address bar, so
 * a refresh or a shared link does not repeat it, and leaves after a few seconds.
 */
export function OfferNotice() {
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const url = new URL(location.href);
    const raw = url.searchParams.get('offer');
    if (!raw) return;
    const [kind, code = ''] = raw.split(':');
    url.searchParams.delete('offer');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    if (!TEXT[kind] || !/^[A-Z0-9-]{3,24}$/.test(code)) return;
    setNote({ ok: kind === 'applied', text: TEXT[kind](code) });
    const t = window.setTimeout(() => setNote(null), 7000);
    return () => window.clearTimeout(t);
  }, []);
  if (!note) return null;
  return (
    <div role="status" className="no-print fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom,0px)+var(--action-bar,0px))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 font-sans text-[14px] text-white shadow-[0_18px_40px_-18px_rgb(4_22_74/.7)] sm:bottom-6">
      <span className={`grid size-7 shrink-0 place-items-center rounded-full ${note.ok ? 'bg-glacier text-ink' : 'bg-white/15'}`}><Icon name={note.ok ? 'check' : 'info'} className="size-4" strokeWidth={2.2} /></span>
      <p className="flex-1 leading-snug">{note.text}</p>
      {note.ok && <Link href="/cart" className="shrink-0 font-semibold text-voltage underline-offset-4 hover:underline">View cart</Link>}
      <button type="button" onClick={() => setNote(null)} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"><Icon name="close" className="size-4" /></button>
    </div>
  );
}
