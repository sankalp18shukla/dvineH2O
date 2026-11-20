'use client';
import { useEffect, useRef, useState } from 'react';
import { applyPromoCode } from '@/app/actions/cart';
import { Icon } from '../ui/Icon';
import s from './CouponCode.module.css';

export type ApplyState = { phase: 'idle' | 'busy' | 'done' | 'error'; message: string };

/** Puts a promoted code on the visitor's cart (applyPromoCode), with the result to show beside the button. */
export function useApplyCode(code: string) {
  const [st, setSt] = useState<ApplyState>({ phase: 'idle', message: '' });
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const apply = async () => {
    if (st.phase === 'busy') return;
    setSt({ phase: 'busy', message: '' });
    const r = await applyPromoCode(code).catch(() => ({ ok: false as const, error: 'Could not apply the code. Please try again.' }));
    if (!alive.current) return;
    setSt(r.ok ? { phase: 'done', message: 'Applied. You’ll see the saving in your cart.' } : { phase: 'error', message: r.error });
  };
  return { ...st, apply };
}

/**
 * A promotion's code with an Apply button (homepage and product-page cards, hero promotion slides). One tap puts
 * the code on the cart, so nobody has to copy and paste it. Colours come from the promotion's theme:
 * `card` sits on the brand-colour block (--p-fg / --p-bg), `hero` on the dark hero card (--accent).
 */
export function CouponChip({ code, variant = 'card', tabIndex, className = '' }: { code: string; variant?: 'card' | 'hero'; tabIndex?: number; className?: string }) {
  const { phase, message, apply } = useApplyCode(code);
  const done = phase === 'done';
  return (
    <div className={`${s.wrap} ${s[variant]} ${className}`}>
      <div className={s.chip} data-done={done || undefined}>
        <span className={s.code}><Icon name="tag" className="size-4 shrink-0" strokeWidth={1.9} /><span className={s.txt}>{code}</span></span>
        <button type="button" onClick={apply} disabled={phase === 'busy' || done} tabIndex={tabIndex} className={s.btn} aria-label={done ? `Code ${code} applied` : `Apply code ${code} to your cart`}>
          {done ? <><Icon name="check" className="size-4" strokeWidth={2.4} />Applied</> : phase === 'busy' ? 'Applying…' : 'Apply'}
        </button>
      </div>
      <p className={s.msg} data-error={phase === 'error' || undefined} aria-live="polite">{message}</p>
    </div>
  );
}
