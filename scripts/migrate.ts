import './env';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import fs from 'node:fs';

fs.mkdirSync('data/uploads', { recursive: true });
const client = createClient({ url: process.env.DATABASE_URL ?? 'file:./data/dvine.db', authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
migrate(drizzle(client), { migrationsFolder: './drizzle' })
  .then(() => console.log('✓ database migrated'))
  .catch(e => { console.error(e); process.exit(1); });
