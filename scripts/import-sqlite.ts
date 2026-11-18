/**
 * Copies the old local SQLite database (data/dvine.db) into Supabase. Needs Node 22.5+ (built-in node:sqlite).
 *
 *   npm run db:import             content only: homepage & promotions, other settings, products, water-test
 *                                 options, pincodes, coupons. Safe to run against the live database (upserts).
 *   npm run db:import -- --all    everything: also customers, staff, orders, payments, enquiries, files …
 *                                 Only into an EMPTY database (run before going live). Customer and staff
 *                                 passwords move with their accounts (bcrypt hashes are imported into
 *                                 Supabase Auth), and uploaded files are copied into Storage.
 */
import './env';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const ALL = process.argv.includes('--all');
const SRC = process.argv.find(a => a.endsWith('.db')) ?? 'data/dvine.db';
const url = process.env.DATABASE_ADMIN_URL;
const supaUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !supaUrl || !secret) { console.error('Set DATABASE_ADMIN_URL, SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.'); process.exit(1); }
if (!fs.existsSync(SRC)) { console.error(`No SQLite database at ${SRC}`); process.exit(1); }

const lite = new DatabaseSync(SRC, { readOnly: true });
const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });
const supabase = createClient(supaUrl, secret, { auth: { persistSession: false, autoRefreshToken: false } });

type Row = Record<string, unknown>;
/** SQLite column → Postgres column where they differ. */
const RENAME: Record<string, Record<string, string>> = { refunds: { created_at: 'initiated_at' }, invoices: { created_at: 'issued_at' } };
const DROP = new Set(['password_hash']);

const CONTENT = ['products', 'test_options', 'pincodes', 'coupons', 'settings'];
const ORDER = [
  'staff', 'customers', 'addresses', 'products', 'stock_movements', 'serial_units', 'carts', 'cart_items', 'cart_events',
  'orders', 'order_items', 'order_events', 'test_options', 'enquiries', 'enquiry_notes', 'water_tests', 'payments', 'refunds',
  'shipments', 'returns', 'order_exceptions', 'invoices', 'referrals', 'coupons', 'pincodes', 'report_uploads', 'installations',
  'warranties', 'service_tickets', 'reviews', 'audit_logs', 'notifications', 'settings', 'counters',
];
/** Upsert keys for content tables (so re-running updates instead of duplicating). */
const KEY: Record<string, string> = { products: 'slug', pincodes: 'pincode', coupons: 'code', settings: 'key', test_options: 'id', counters: 'key' };

async function pgColumns(table: string) {
  const rows = await sql<{ column_name: string; data_type: string }[]>`
    select column_name, data_type from information_schema.columns where table_schema = 'dvine' and table_name = ${table}`;
  return new Map(rows.map(r => [r.column_name, r.data_type]));
}

function convert(v: unknown, type: string) {
  if (v === null || v === undefined) return null;
  if (type === 'timestamp with time zone') return new Date(typeof v === 'number' ? v : Number(v) || String(v));
  if (type === 'boolean') return v === 1 || v === true || v === '1';
  if (type === 'jsonb') return typeof v === 'string' ? v : JSON.stringify(v);
  if (type === 'integer' || type === 'bigint') return Number(v);
  return v;
}

async function copyTable(table: string, opts: { upsert: boolean }) {
  const cols = await pgColumns(table);
  if (!cols.size) return 0;
  const rows = lite.prepare(`select * from "${table}"`).all() as Row[];
  let n = 0;
  for (const r of rows) {
    const entries = Object.entries(r)
      .filter(([k]) => !DROP.has(k))
      .map(([k, v]) => [RENAME[table]?.[k] ?? k, v] as const)
      .filter(([k]) => cols.has(k))
      .filter(([k]) => !(opts.upsert && table === 'products' && k === 'id')); // content mode: match products by slug
    const names = entries.map(([k]) => `"${k}"`).join(', ');
    const params = entries.map(([k, v]) => convert(v, cols.get(k)!));
    const ph = entries.map(([k], i) => `$${i + 1}${cols.get(k) === 'jsonb' ? '::jsonb' : ''}`).join(', ');
    const key = KEY[table];
    const conflict = opts.upsert && key
      ? `on conflict ("${key}") do update set ${entries.filter(([k]) => k !== key && k !== 'id' && !['on_hand', 'reserved', 'used_count', 'created_at'].includes(k)).map(([k]) => `"${k}" = excluded."${k}"`).join(', ')}`
      : 'on conflict do nothing';
    await sql.unsafe(`insert into dvine."${table}" (${names}) values (${ph}) ${conflict}`, params as never[]);
    n++;
  }
  if (cols.has('id')) await sql.unsafe(`select setval(pg_get_serial_sequence('dvine."${table}"', 'id'), greatest(coalesce((select max(id) from dvine."${table}"), 0), 1))`);
  return n;
}

async function authUser(email: string, passwordHash: string | null, name: string) {
  const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name }, ...(passwordHash ? { password_hash: passwordHash } : {}) });
  if (!error) return data.user.id;
  for (let page = 1; page < 50; page++) {
    const { data: list } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const u = list?.users.find(x => x.email?.toLowerCase() === email);
    if (u) return u.id;
    if (!list || list.users.length < 200) break;
  }
  throw new Error(`Could not create or find the sign-in for ${email}: ${error.message}`);
}

async function uploadDir(local: string, bucket: string, prefix = '') {
  if (!fs.existsSync(local)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(local, { withFileTypes: true })) {
    const full = path.join(local, e.name), key = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) { n += await uploadDir(full, bucket, key); continue; }
    if (e.name.startsWith('.')) continue;
    const ext = path.extname(e.name).toLowerCase();
    const type = ({ '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' } as Record<string, string>)[ext];
    if (!type) continue;
    const { error } = await supabase.storage.from(bucket).upload(key, fs.readFileSync(full), { contentType: type, upsert: true });
    if (error) console.warn(`  ! ${bucket}/${key}: ${error.message}`); else n++;
  }
  return n;
}

async function main() {
  if (!ALL) {
    for (const t of CONTENT) console.log(`✓ ${t}: ${await copyTable(t, { upsert: true })}`);
    const media = await uploadDir('data/media', 'media');
    console.log(`✓ media library files: ${media}`);
    console.log('Done. Homepage & promotions, products and settings now match your local copy.');
    return;
  }

  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from dvine.orders`;
  if (n > 0) throw new Error('The Supabase database already has orders. --all only imports into an empty database; use the content-only import instead.');
  const hashes = new Map<string, { email: string; hash: string | null; name: string; table: 'staff' | 'customers' }>();
  for (const t of ['staff', 'customers'] as const)
    for (const r of lite.prepare(`select id, email, name, password_hash from ${t}`).all() as Row[])
      if (r.email && (t === 'staff' || r.password_hash)) hashes.set(`${t}:${r.id}`, { email: String(r.email).toLowerCase(), hash: (r.password_hash as string) ?? null, name: String(r.name), table: t });

  // the seed's rows are replaced by the local copy (staff are re-linked to their Supabase sign-ins below)
  await sql`truncate dvine.staff, dvine.products, dvine.test_options, dvine.pincodes, dvine.coupons, dvine.settings, dvine.counters restart identity cascade`;
  for (const t of ORDER) console.log(`✓ ${t}: ${await copyTable(t, { upsert: false })}`);

  for (const [k, v] of hashes) {
    const id = Number(k.split(':')[1]);
    const uid = await authUser(v.email, v.hash, v.name);
    await sql.unsafe(`update dvine."${v.table}" set auth_user_id = $1 where id = $2 and auth_user_id is null`, [uid, id]);
    console.log(`  ✓ sign-in moved: ${v.table} ${v.email}`);
  }
  console.log(`✓ private files: ${await uploadDir('data/uploads', 'private')}`);
  console.log(`✓ media library files: ${await uploadDir('data/media', 'media')}`);
  const reviewFiles = await uploadDir('public/uploads/reviews', 'review-photos', 'reviews');
  if (reviewFiles) {
    await sql`update dvine.reviews set media = (select jsonb_agg(replace(m, '/uploads/reviews/', ${`${supaUrl!.replace(/\/$/, '')}/storage/v1/object/public/review-photos/reviews/`})) from jsonb_array_elements_text(media) m) where media is not null and jsonb_array_length(media) > 0`;
    console.log(`✓ review photos: ${reviewFiles}`);
  }
  console.log('Done. Staff still set up an authenticator app at their next sign-in.');
}

main().then(() => sql.end()).catch(async e => { console.error(e); await sql.end(); process.exit(1); });
