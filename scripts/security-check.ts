/**
 * Verifies the security set-up against your real Supabase project. Run after `npm run db:setup`:
 *
 *   npm run db:check
 *
 * Every line should be ✓. It changes nothing (each probe that could write runs inside a rolled-back transaction).
 */
import './env';
import postgres from 'postgres';

const results: [boolean, string][] = [];
const ok = (pass: boolean, what: string) => results.push([pass, what]);
const env = process.env;
const supaUrl = (env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const anon = env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY ?? '';

/** Runs a statement as the app role inside a transaction that is always rolled back; resolves to the error code. */
async function attempt(sql: postgres.Sql, stmt: string) {
  try {
    await sql.begin(async tx => { await tx.unsafe(stmt); throw Object.assign(new Error('rollback'), { code: 'ROLLBACK_OK' }); });
    return 'none';
  } catch (e) { return (e as { code?: string }).code ?? 'error'; }
}

async function main() {
  // ── Configuration
  ok(!!env.APP_SECRET && env.APP_SECRET.length >= 32, 'APP_SECRET is set (32+ characters)');
  ok(env.ALLOW_TEST_PAYMENTS !== 'true', 'Test payments are off (ALLOW_TEST_PAYMENTS is not true)');
  ok(env.STAFF_MFA_REQUIRED !== 'false', 'Staff two-step sign-in is required');
  ok(!!env.CRON_SECRET && env.CRON_SECRET.length >= 24, 'CRON_SECRET is set (24+ characters)');
  ok(!Object.keys(env).some(k => k.startsWith('NEXT_PUBLIC_') && /SECRET|SERVICE_ROLE|PASSWORD|DATABASE/i.test(k)), 'No secret is exposed through a NEXT_PUBLIC_ variable');
  ok(!env.SEED_ADMIN_PASSWORD, 'SEED_ADMIN_PASSWORD has been removed after seeding');

  // ── Database, as the app connects
  const url = env.DATABASE_URL;
  if (!url) ok(false, 'DATABASE_URL is set');
  else {
    const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });
    const [{ who }] = await sql<{ who: string }[]>`select current_user as who`;
    ok(who === 'dvine_app', `App connects as the least-privilege role (dvine_app), not ${who}`);
    const [{ su, bypass }] = await sql<{ su: boolean; bypass: boolean }[]>`select rolsuper as su, rolbypassrls as bypass from pg_roles where rolname = current_user`;
    ok(!su && !bypass, 'App role is not a superuser and does not bypass RLS');
    ok((await attempt(sql, 'select 1 from dvine.products limit 1')) === 'ROLLBACK_OK', 'App role can read the store data');
    ok((await attempt(sql, 'select 1 from auth.users limit 1')) === '42501', 'App role cannot read Supabase Auth users');
    ok((await attempt(sql, 'select 1 from storage.objects limit 1')) === '42501', 'App role cannot read Storage internals');
    ok((await attempt(sql, 'delete from dvine.orders where false')) === '42501', 'Orders cannot be deleted');
    ok((await attempt(sql, 'delete from dvine.payments where false')) === '42501', 'Payments cannot be deleted');
    ok((await attempt(sql, 'update dvine.invoices set total = total where false')) === '42501', 'Invoices cannot be edited');
    ok((await attempt(sql, 'update dvine.audit_logs set action = action where false')) === '42501', 'The audit log cannot be edited');
    ok((await attempt(sql, 'truncate dvine.rate_limits')) === '42501', 'Tables cannot be truncated');
    ok((await attempt(sql, 'create table dvine.x (id int)')) === '42501', 'The app role cannot change the schema');
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from pg_tables where schemaname = 'dvine' and not rowsecurity`;
    ok(n === 0, 'Row Level Security is on for every table');
    await sql.end();
  }

  // ── The public API (what anyone on the internet can reach with the publishable key)
  if (supaUrl && anon) {
    const h = { apikey: anon, Authorization: `Bearer ${anon}` };
    const rest = await fetch(`${supaUrl}/rest/v1/orders?select=*&limit=1`, { headers: { ...h, 'Accept-Profile': 'dvine' } });
    ok(rest.status >= 400, `Store data is not reachable through the Data API (HTTP ${rest.status})`);
    const pub = await fetch(`${supaUrl}/rest/v1/orders?select=*&limit=1`, { headers: h });
    ok(pub.status >= 400, `No "orders" table in the public API schema (HTTP ${pub.status})`);
    const up = await fetch(`${supaUrl}/storage/v1/object/media/security-check.txt`, { method: 'POST', headers: { ...h, 'Content-Type': 'image/png' }, body: 'x' });
    ok(up.status >= 400, `Visitors cannot upload to Storage (HTTP ${up.status})`);
    const list = await fetch(`${supaUrl}/storage/v1/object/list/private`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: '' }) });
    const listed = list.ok ? ((await list.json()) as unknown[]).length : 0;
    ok(listed === 0, 'Visitors cannot list private files');
    const priv = await fetch(`${supaUrl}/storage/v1/object/public/private/x.pdf`);
    ok(priv.status >= 400, 'The private bucket has no public URLs');
  } else ok(false, 'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set');

  for (const [pass, what] of results) console.log(`${pass ? '✓' : '✗'} ${what}`);
  const failed = results.filter(r => !r[0]).length;
  console.log(failed ? `\n${failed} check(s) failed — see docs/supabase.md` : '\nAll checks passed.');
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
