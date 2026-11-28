import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Supabase Postgres, reached only from the server.
 *
 * DATABASE_URL should be the Supavisor *transaction* pooler (port 6543) signed in as the least-privilege
 * `dvine_app` role (user `dvine_app.<project-ref>`), e.g.
 *   postgresql://dvine_app.abcd1234:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
 * Transaction pooling does not support prepared statements, hence `prepare: false`.
 */
const globalForDb = globalThis as unknown as { __dvineDb?: ReturnType<typeof make> };

function make() {
  const url = process.env.DATABASE_URL;
  // Without a URL (e.g. `next build`, a frontend-only preview) every query fails fast and callers fall back to defaults.
  if (!url) console.warn('[db] DATABASE_URL is not set: database calls will fail and pages will use their built-in defaults.');
  const client = postgres(url || 'postgres://unset@127.0.0.1:1/unset', {
    prepare: false,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    // dev reaches the Mumbai pooler from afar, where a fresh TLS + auth handshake can take seconds; keep connections warm
    idle_timeout: process.env.NODE_ENV === 'production' ? 20 : 600,
    connect_timeout: 10,
    ssl: url && !/@(localhost|127\.0\.0\.1)[:/]/.test(url) ? 'require' : false,
    connection: { application_name: 'dvine-web' },
    onnotice: () => {},
  });
  return drizzle(client, { schema });
}

export const db = globalForDb.__dvineDb ?? make();
if (process.env.NODE_ENV !== 'production') globalForDb.__dvineDb = db;

export type DB = typeof db;
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
export { schema };
