import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reportUploads, waterTests } from '@/lib/db/schema';
import { getStaff, getCustomer } from '@/lib/auth';
import { can } from '@/lib/session';
import { readPrivate } from '@/lib/uploads';
import { safeEqual } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Private files from Storage:
 *   wt-<ref>   lab report for a water test: staff, the customer who booked it, or the holder of its access link
 *   <id>       a file a visitor uploaded with a form (water report, site photos): staff with enquiry access only
 * Anything not allowed answers 404, so the route doesn't reveal which files exist.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  let stored: string | null = null, name = 'report', mime = 'application/pdf';
  if (id.startsWith('wt-')) {
    const w = await db.query.waterTests.findFirst({ where: eq(waterTests.ref, id.slice(3)) });
    if (!w?.reportPath) return notFound();
    const [s, c] = await Promise.all([getStaff(), getCustomer()]);
    if (!(s || (c && c.id === w.customerId) || safeEqual(url.searchParams.get('t'), w.accessToken))) return notFound();
    stored = w.reportPath; name = `${w.ref}-report.pdf`;
  } else {
    const s = await getStaff();
    if (!s || !can(s.role, 'enquiries') || !/^\d+$/.test(id)) return notFound();
    const r = await db.query.reportUploads.findFirst({ where: eq(reportUploads.id, Number(id)) });
    if (!r) return notFound();
    stored = r.storedPath; name = r.fileName; mime = r.mime;
  }
  const buf = await readPrivate(stored);
  if (!buf) return notFound();
  const safeName = name.replace(/[^\w.\- ()]/g, '_');
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `${mime === 'application/pdf' || mime.startsWith('image/') ? 'inline' : 'attachment'}; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
