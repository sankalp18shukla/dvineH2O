'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { beginPayment, completeRazorpay, failRazorpay, completeTestPayment } from '@/app/actions/payments';
import { formatINR } from '@/lib/money';
import { Icon } from '../ui/Icon';

type Props = { kind: 'order' | 'water_test'; ref_: string; token: string; amount: number; prefill: { name: string; email?: string | null; phone?: string | null }; successHref: string; testAllowed: boolean };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error: Record<string, string> }) => void) => void } } }

function loadScript() {
  return new Promise<boolean>(res => {
    if (window.Razorpay) return res(true);
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
  });
}

export function PayPanel({ kind, ref_, token, amount, prefill, successHref, testAllowed }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<{ gatewayOrderId: string } | null>(null);
  const [method, setMethod] = useState('upi');

  const pay = async () => {
    setBusy(true); setError(null);
    const r = await beginPayment(kind, ref_, token);
    if ('already' in r && r.already) { router.push(successHref); return; }
    if ('error' in r && r.error) { setError(r.error); setBusy(false); return; }
    const s = r.session!;
    if (s.mode === 'test') { setTest({ gatewayOrderId: s.gatewayOrderId }); setBusy(false); return; }
    if (!(await loadScript())) { setError('Could not load the payment window. Check your connection and try again.'); setBusy(false); return; }
    const rz = new window.Razorpay!({
      key: s.keyId, order_id: s.gatewayOrderId, amount: s.amount, currency: 'INR', name: 'DVINE H2O', description: s.receipt,
      prefill: { name: prefill.name, email: prefill.email ?? '', contact: prefill.phone ?? '' }, theme: { color: '#046FED' },
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await completeRazorpay(kind, ref_, token, resp);
        if (v.error) { setError(v.error); setBusy(false); return; }
        router.push(successHref);
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rz.on('payment.failed', async resp => { await failRazorpay(kind, ref_, token, s.gatewayOrderId, resp.error); setError(resp.error?.description ?? 'Payment failed. You can try again.'); setBusy(false); });
    rz.open();
  };

  const finishTest = async (outcome: 'success' | 'failure') => {
    if (!test) return; setBusy(true);
    const r = await completeTestPayment(kind, ref_, token, test.gatewayOrderId, outcome, method);
    if ('ok' in r && r.ok) { router.push(successHref); return; }
    setTest(null); setBusy(false); setError('error' in r && r.error ? r.error : 'Payment failed. You can try again.');
  };

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between font-sans"><span className="text-muted">Amount to pay</span><span className="text-3xl font-bold">{formatINR(amount)}</span></div>
      {!test ? (
        <>
          <button onClick={pay} disabled={busy} className="btn btn-primary mt-6 w-full">{busy ? 'Opening payment…' : <>Pay {formatINR(amount)} securely <Icon name="arrow" className="size-4" /></>}</button>
          <p className="mt-3 flex items-center justify-center gap-2 font-sans text-[13px] text-muted"><Icon name="shield" className="size-4" /> UPI, cards, net banking, wallets, EMI and pay later via Razorpay</p>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-[#E8A600] bg-[#FFF8E1] p-5 font-sans" role="region" aria-label="Test payment">
          <p className="font-semibold text-[#7A4B00]">Test payment mode</p>
          <p className="mt-1 text-sm text-[#7A4B00]">Razorpay keys aren’t set, so this simulates the gateway. No money moves.</p>
          <label htmlFor="tm" className="label mt-4 block">Method</label>
          <select id="tm" className="input mt-1.5" value={method} onChange={e => setMethod(e.target.value)}>
            <option value="upi">UPI</option><option value="card">Card</option><option value="netbanking">Net banking</option><option value="wallet">Wallet</option><option value="emi">EMI</option>
          </select>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => finishTest('success')} disabled={busy} className="btn btn-primary">Simulate success</button>
            <button onClick={() => finishTest('failure')} disabled={busy} className="btn btn-outline">Simulate failure</button>
          </div>
        </div>
      )}
      {!testAllowed && test && <p className="mt-2 text-sm text-[#8A0E18]">Test payments are disabled.</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#FFE3E3] px-4 py-3 font-sans text-[15px] text-[#8A0E18]">{error}</p>}
    </div>
  );
}
