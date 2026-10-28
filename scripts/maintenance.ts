// Run on a schedule (e.g. every 10 minutes) if you are not calling /api/cron/maintenance.
import './env';
const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/cron/maintenance`;
fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } })
  .then(async r => console.log(r.status, await r.text()))
  .catch(e => { console.error(e); process.exit(1); });
