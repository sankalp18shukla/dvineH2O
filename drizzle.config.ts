import { defineConfig } from 'drizzle-kit';

/**
 * The database is defined by the SQL in supabase/migrations (tables, RLS, grants, triggers) and applied with
 * `npm run db:migrate`. Drizzle Kit is only used to compare / introspect (e.g. `npx drizzle-kit pull`).
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['dvine'],
  dbCredentials: { url: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL ?? '' },
});
