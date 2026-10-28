import fs from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reportUploads, waterTests } from '@/lib/db/schema';
import { getStaff, getCustomer } from '@/lib/auth';
import { PRIVATE_DIR } from '@/lib/uploads';

/** Private files: uploaded water reports (staff only) and lab reports for a water test (staff, owner, or token holder). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  let stored: string | null = null, name = 'report', mime = 'application/pdf';
  if (id.startsWith('wt-')) {
    const w = await db.query.waterTests.findFirst({ where: eq(waterTests.ref, id.slice(3)) });
    const [s, c] = await Promise.all([getStaff(), getCustomer()]);
    if (!w?.reportPath || !(s || (c && c.id === w.customerId) || url.searchParams.get('t') === w.accessToken)) return new Response('Not found', { status: 404 });
    stored = w.reportPath; name = `${w.ref}-report.pdf`;
  } else {
    if (!(await getStaff())) return new Response('Not found', { status: 404 });
    const r = await db.query.reportUploads.findFirst({ where: eq(reportUploads.id, Number(id)) });
    if (!r) return new Response('Not found', { status: 404 });
    stored = r.storedPath; name = r.fileName; mime = r.mime;
  }
  const full = path.join(PRIVATE_DIR, stored);
  if (!full.startsWith(PRIVATE_DIR)) return new Response('Not found', { status: 404 });
  const buf = await fs.readFile(full).catch(() => null);
  if (!buf) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { 'Content-Type': mime, 'Content-Disposition': `inline; filename="${name.replace(/"/g, '')}"`, 'Cache-Control': 'private, no-store' } });
}
