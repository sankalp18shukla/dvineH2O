import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PageHead, Panel, TableWrap, Empty, dt } from '@/components/admin/ui';

export const metadata = { title: 'Audit log' };

export default async function Audit() {
  await requireStaff('audit');
  const list = await db.query.auditLogs.findMany({ orderBy: desc(auditLogs.createdAt), limit: 300, with: { staff: true } });
  return (
    <>
      <PageHead title="Audit log" sub="Who changed what, and when." />
      <Panel>
        {list.length === 0 ? <Empty>No activity yet.</Empty> : (
          <TableWrap>
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Detail</th></tr></thead>
            <tbody>{list.map(a => <tr key={a.id}><td className="whitespace-nowrap">{dt(a.createdAt)}</td><td>{a.staff?.name ?? 'system'}</td><td className="font-mono text-[12px]">{a.action}</td><td>{a.entity}{a.entityId ? ` #${a.entityId}` : ''}</td><td className="max-w-md truncate font-mono text-[11px] text-muted" title={a.detail ? JSON.stringify(a.detail) : ''}>{a.detail ? JSON.stringify(a.detail) : ''}</td></tr>)}</tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
