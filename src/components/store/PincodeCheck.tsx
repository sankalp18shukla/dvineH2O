'use client';
import { useState, useTransition } from 'react';
import { checkPincode, type PincodeResult } from '@/app/actions/cart';
import { Icon } from '../ui/Icon';

export function PincodeCheck({ installationNote = false, dark = false }: { installationNote?: boolean; dark?: boolean }) {
  const [pin, setPin] = useState('');
  const [res, setRes] = useState<PincodeResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="font-sans">
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); start(async () => setRes(await checkPincode(pin))); }}>
        <label htmlFor="pin" className="sr-only">Delivery pincode</label>
        <div className="relative flex-1">
          <Icon name="pin" className={`absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 ${dark ? 'text-white/60' : 'text-muted'}`} />
          <input id="pin" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="postal-code" placeholder="Enter pincode" className={`input pl-10 ${dark ? 'border-white/20 bg-white/10 text-white placeholder:text-white/50' : ''}`} />
        </div>
        <button className={`btn ${dark ? 'btn-outline' : 'btn-outline'} min-h-12`} disabled={pending || pin.length !== 6}>{pending ? 'Checking…' : 'Check'}</button>
      </form>
      {res && (
        <p role="status" className={`mt-2.5 flex items-start gap-2 text-[14px] ${res.ok ? (dark ? 'text-glacier' : 'text-[#14532D]') : (dark ? 'text-[#FFB3B3]' : 'text-[#8A0E18]')}`}>
          <Icon name={res.ok ? 'check' : 'info'} className="mt-0.5 size-4 shrink-0" />
          <span>{res.message}{res.ok && installationNote && (res.installation ? ' Installation is available here.' : ' Contact us to arrange installation here.')}</span>
        </p>
      )}
    </div>
  );
}
