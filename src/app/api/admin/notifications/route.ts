import { getStaff } from '@/lib/auth';
import { adminNotes } from '@/lib/admin-notifications';

export const dynamic = 'force-dynamic';

/** The notification bell polls this while an admin tab is open. Staff only. */
export async function GET() {
  const s = await getStaff();
  if (!s) return Response.json({ error: 'Not allowed' }, { status: 403 });
  return Response.json({ notes: await adminNotes(s) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
