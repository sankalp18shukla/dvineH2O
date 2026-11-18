/**
 * Applies supabase/migrations/*.sql in order, once each, as the database owner (DATABASE_ADMIN_URL).
 * Uses the same bookkeeping table as the Supabase CLI, so `supabase db push` and this script agree.
 * If DATABASE_APP_PASSWORD is set, also gives the least-privilege `dvine_app` role that password and LOGIN.
 *
 *   npm run db:migrate
 */
import './env';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const url = process.env.DATABASE_ADMIN_URL;
if (!url) {
  console.error('Set DATABASE_ADMIN_URL (Supabase › Connect › Session pooler, user postgres.<project-ref>) in .env.local');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });
const dir = path.join(process.cwd(), 'supabase', 'migrations');

async function main() {
  await sql`create schema if not exists supabase_migrations`;
  await sql`create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text)`;
  const done = new Set((await sql<{ version: string }[]>`select version from supabase_migrations.schema_migrations`).map(r => r.version));

  const files = fs.readdirSync(dir).filter(f => /^\d+_.+\.sql$/.test(f)).sort();
  for (const f of files) {
    const [version, ...rest] = f.replace(/\.sql$/, '').split('_');
    if (done.has(version)) { console.log(`· ${f} (already applied)`); continue; }
    const body = fs.readFileSync(path.join(dir, f), 'utf8');
    await sql.begin(async tx => {
      await tx.unsafe(body);
      await tx`insert into supabase_migrations.schema_migrations (version, name, statements) values (${version}, ${rest.join('_')}, ${[body]})`;
    });
    console.log(`✓ ${f}`);
  }

  const pw = process.env.DATABASE_APP_PASSWORD;
  if (pw) {
    if (pw.length < 24) throw new Error('DATABASE_APP_PASSWORD must be at least 24 characters (openssl rand -base64 32).');
    const [{ stmt }] = await sql<{ stmt: string }[]>`select format('alter role dvine_app with login password %L', ${pw}::text) as stmt`;
    await sql.unsafe(stmt);
    console.log('✓ dvine_app can sign in (use it in DATABASE_URL)');
  }
  console.log('✓ database is up to date');
}

main().then(() => sql.end()).catch(async e => { console.error(e); await sql.end(); process.exit(1); });
