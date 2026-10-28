import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { requireStaff } from '@/lib/auth';
import { PageHead, Panel, TableWrap, Empty, dt } from '@/components/admin/ui';
import { Status } from '@/components/ui/Status';

export const metadata = { title: 'Notifications' };

export default async function Notifications() {
  await requireStaff('settings');
  const list = await db.query.notifications.findMany({ orderBy: desc(notifications.createdAt), limit: 150 });
  return (
    <>
      <PageHead title="Notifications" sub={`Every email and WhatsApp message the system sends. ${process.env.SMTP_HOST ? 'Email: SMTP connected.' : 'Email: not connected (messages are logged here).'} ${process.env.WHATSAPP_TOKEN ? 'WhatsApp: connected.' : 'WhatsApp: not connected.'}`} />
      <Panel>
        {list.length === 0 ? <Empty>No messages yet.</Empty> : (
          <TableWrap>
            <thead><tr><th>When</th><th>Channel</th><th>To</th><th>Template</th><th>Subject / message</th><th>Status</th></tr></thead>
            <tbody>{list.map(n => <tr key={n.id}><td className="whitespace-nowrap">{dt(n.createdAt)}</td><td>{n.channel}</td><td>{n.to}</td><td>{n.template}</td><td className="max-w-md"><details><summary className="cursor-pointer">{n.subject}</summary><pre className="mt-2 font-sans text-[12px] whitespace-pre-wrap text-muted">{n.body}</pre></details></td><td><Status value={n.status} />{n.error && <span className="block max-w-48 truncate text-[11px] text-[#A1101B]" title={n.error}>{n.error}</span>}</td></tr>)}</tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
