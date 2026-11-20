import { NextResponse } from 'next/server';
import { runMaintenance } from '@/lib/orders';
import { safeEqual } from '@/lib/security';
import { syncFeeds } from '@/lib/sheet-sync';

/** Call every 5–10 minutes (Vercel Cron, a server crontab, or `npm run cron`). */
async function handle(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 24 || !safeEqual(auth, `Bearer ${process.env.CRON_SECRET}`)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const result = await runMaintenance();
  // keep every linked Google Sheet current (statuses, late changes) and pull the pincode sheet
  const sheets = await syncFeeds().catch(e => [{ ok: false, message: String(e) }]);
  return NextResponse.json({ ...result, sheets });
}
export const GET = handle;
export const POST = handle;
