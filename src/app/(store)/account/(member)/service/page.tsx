import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { serviceTickets, warranties } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { rateService } from '@/app/actions/account';
import { ServiceRequestForm } from '@/components/forms/AccountForms';
import { Status } from '@/components/ui/Status';

export const metadata = { title: 'Service requests' };

export default async function MyService() {
  const c = await requireCustomer('/account/service');
  const [tickets, ws] = await Promise.all([
    db.query.serviceTickets.findMany({ where: eq(serviceTickets.customerId, c.id), orderBy: desc(serviceTickets.createdAt), with: { product: true } }),
    db.query.warranties.findMany({ where: and(eq(warranties.customerId, c.id), eq(warranties.status, 'active')), with: { product: true } }),
  ]);
  return (
    <div className="grid gap-6">
      <section className="card p-6"><h2 className="mb-4 font-sans text-lg font-semibold">Raise a service request</h2><ServiceRequestForm warranties={ws.map(w => ({ id: w.id, label: `${w.product.name}${w.serial ? ` · ${w.serial}` : ''} · until ${w.expiresAt.toLocaleDateString('en-IN')}` }))} /></section>
      <section className="card p-6">
        <h2 className="font-sans text-lg font-semibold">Your requests</h2>
        {tickets.length === 0 ? <p className="mt-3 text-muted">No service requests yet.</p> : (
          <ul className="mt-4 divide-y divide-line">
            {tickets.map(t => (
              <li key={t.id} className="py-4 font-sans">
                <div className="flex flex-wrap items-center justify-between gap-2"><b>{t.number}{t.product ? ` · ${t.product.shortName}` : ''}</b><Status value={t.status} /></div>
                <p className="mt-1 text-[15px] text-muted">{t.issue}</p>
                {t.actionTaken && <p className="mt-1 text-sm"><b>Resolution:</b> {t.actionTaken}</p>}
                {['resolved', 'closed'].includes(t.status) && !t.rating && (
                  <form action={rateService} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <label htmlFor={`r-${t.id}`} className="text-sm">How did we do?</label>
                    <select id={`r-${t.id}`} name="rating" className="input min-h-10 w-auto py-1 text-sm">{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} / 5</option>)}</select>
                    <input name="feedback" placeholder="Comment (optional)" className="input min-h-10 w-56 text-sm" />
                    <button className="btn btn-outline btn-sm">Send</button>
                  </form>
                )}
                {t.rating && <p className="mt-1 text-sm text-muted">You rated this {t.rating}/5. Thank you.</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
