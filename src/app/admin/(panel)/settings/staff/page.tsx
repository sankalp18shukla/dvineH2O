import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { staff } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/session';
import { PageHead, Panel, dt } from '@/components/admin/ui';
import { AdminForm, AdminError } from '@/components/admin/AdminForm';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { saveStaff } from '@/app/actions/admin';

export const metadata = { title: 'Staff' };

export default async function Staff() {
  await requireStaff('settings');
  const list = await db.query.staff.findMany({ orderBy: asc(staff.createdAt) });
  const sel = 'input min-h-9 text-[13px]';
  const Row = ({ s }: { s?: typeof list[number] }) => (
    <AdminForm action={saveStaff} className="grid gap-2 sm:grid-cols-[1fr_1.2fr_140px_1fr_auto_auto] sm:items-center">
      <input type="hidden" name="id" value={s?.id ?? ''} />
      <input name="name" defaultValue={s?.name} placeholder="Name" className={sel} aria-label="Name" required />
      <div><input name="email" defaultValue={s?.email} placeholder="Email" className={sel} aria-label="Email" required /><AdminError name="email" /></div>
      <select name="role" defaultValue={s?.role ?? 'support'} className={sel} aria-label="Role"><option value="admin">Admin</option><option value="operations">Operations</option><option value="support">Support</option></select>
      <div><input name="password" type="password" placeholder={s ? 'New password (optional)' : 'Password (10+ chars)'} className={sel} aria-label="Password" autoComplete="new-password" /><AdminError name="password" /></div>
      <label className="flex items-center gap-1.5 font-sans text-[13px]"><input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="check mt-0" />Active</label>
      <SubmitButton className="btn btn-outline btn-sm min-h-9">{s ? 'Save' : 'Add'}</SubmitButton>
    </AdminForm>
  );
  return (
    <>
      <PageHead title="Staff & roles" />
      <Panel title="Team">
        <div className="grid gap-3">{list.map(s => <div key={s.id}><Row s={s} /><p className="mt-1 font-sans text-[12px] text-muted">Last sign-in {dt(s.lastLoginAt)}</p></div>)}</div>
        <div className="mt-6 border-t border-line pt-4"><p className="mb-2 font-sans text-sm font-semibold">Add a team member</p><Row /></div>
      </Panel>
      <Panel title="What each role can do" className="mt-6">
        <div className="-mx-5 -my-5 overflow-x-auto"><table className="table"><thead><tr><th>Area</th><th>Admin</th><th>Operations</th><th>Support</th></tr></thead><tbody>{Object.entries(PERMISSIONS).map(([k, roles]) => <tr key={k}><td>{k}</td>{(['admin', 'operations', 'support'] as const).map(r => <td key={r}>{(roles as string[]).includes(r) ? '✓' : '—'}</td>)}</tr>)}</tbody></table></div>
      </Panel>
    </>
  );
}
