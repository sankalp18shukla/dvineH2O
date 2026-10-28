import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { addresses } from '@/lib/db/schema';
import { requireCustomer } from '@/lib/auth';
import { deleteAddress } from '@/app/actions/account';
import { ProfileForm, AddressForm } from '@/components/forms/AccountForms';

export const metadata = { title: 'Profile' };

export default async function Profile() {
  const c = await requireCustomer('/account/profile');
  const list = await db.query.addresses.findMany({ where: eq(addresses.customerId, c.id), orderBy: desc(addresses.isDefault) });
  return (
    <div className="grid gap-6">
      <section className="card p-6"><h2 className="mb-4 font-sans text-lg font-semibold">Profile</h2><ProfileForm c={c} /></section>
      <section className="card p-6">
        <h2 className="font-sans text-lg font-semibold">Saved addresses</h2>
        {list.length > 0 && <ul className="mt-4 grid gap-3 sm:grid-cols-2">{list.map(a => (
          <li key={a.id} className="rounded-2xl border border-line p-4 font-sans text-sm">
            <p className="font-semibold">{a.name}{a.isDefault && <span className="badge ml-2 bg-paper">Default</span>}</p>
            <p className="mt-1 text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
            <form action={deleteAddress} className="mt-2"><input type="hidden" name="id" value={a.id} /><button className="text-[13px] font-semibold text-[#C2001B] hover:underline">Remove</button></form>
          </li>
        ))}</ul>}
        <h3 className="mt-6 mb-4 font-sans font-semibold">Add an address</h3>
        <AddressForm />
      </section>
    </div>
  );
}
