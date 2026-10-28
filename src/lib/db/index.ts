import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { __dvineDb?: ReturnType<typeof make> };

function make() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? 'file:./data/dvine.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  return drizzle(client, { schema });
}

export const db = globalForDb.__dvineDb ?? make();
if (process.env.NODE_ENV !== 'production') globalForDb.__dvineDb = db;

export type DB = typeof db;
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
export { schema };
