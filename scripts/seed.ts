/**
 * Seeds a fresh Supabase database: the 3 SKUs, water-test options, serviceable pincodes, the WELCOME5 coupon,
 * the blog's starter posts, the homepage promotions (supabase/seed/site-content.json — the Diwali slide, ribbon and gifting card that are
 * live on the site today) and the first admin (a Supabase Auth user + dvine.staff row).
 * Safe to re-run: existing rows are left as they are.
 *
 *   npm run db:seed
 *
 * ⚠ Prices, stock, test prices and pincodes are PLACEHOLDERS. Confirm them and edit in Admin before launch.
 */
import './env';
import fs from 'node:fs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import * as schema from '../src/lib/db/schema';
import { SEED_PRODUCTS, SEED_TESTS } from '../src/lib/seed-data';
import { SEED_POSTS } from '../src/lib/blog-seed';

const url = process.env.DATABASE_ADMIN_URL;
const supaUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !supaUrl || !secret) {
  console.error('Set DATABASE_ADMIN_URL, SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.');
  process.exit(1);
}
const client = postgres(url, { max: 1, prepare: false, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });
const db = drizzle(client, { schema });
const auth = createClient(supaUrl, secret, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
const P = (rupees: number) => rupees * 100;

// Representative metro pincodes for development. Replace with the real serviceability list.
const PINS: [string, string, string, boolean, number][] = [
  ['110001', 'New Delhi', 'Delhi', true, 3], ['110016', 'New Delhi', 'Delhi', true, 3], ['110085', 'New Delhi', 'Delhi', true, 3],
  ['122001', 'Gurugram', 'Haryana', true, 3], ['122018', 'Gurugram', 'Haryana', true, 3], ['201301', 'Noida', 'Uttar Pradesh', true, 3],
  ['400001', 'Mumbai', 'Maharashtra', true, 4], ['400050', 'Mumbai', 'Maharashtra', true, 4], ['400076', 'Mumbai', 'Maharashtra', true, 4],
  ['411001', 'Pune', 'Maharashtra', true, 4], ['411045', 'Pune', 'Maharashtra', false, 5],
  ['560001', 'Bengaluru', 'Karnataka', true, 4], ['560034', 'Bengaluru', 'Karnataka', true, 4], ['560103', 'Bengaluru', 'Karnataka', true, 4],
  ['600001', 'Chennai', 'Tamil Nadu', true, 5], ['600040', 'Chennai', 'Tamil Nadu', false, 5],
  ['500001', 'Hyderabad', 'Telangana', true, 5], ['500081', 'Hyderabad', 'Telangana', true, 5],
  ['700001', 'Kolkata', 'West Bengal', true, 5], ['700091', 'Kolkata', 'West Bengal', false, 6],
  ['380001', 'Ahmedabad', 'Gujarat', true, 5], ['302001', 'Jaipur', 'Rajasthan', false, 6], ['160017', 'Chandigarh', 'Chandigarh', false, 5],
];

/** Finds an Auth user by email (the admin API has no direct lookup). */
async function findUser(email: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await auth.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find(x => x.email?.toLowerCase() === email);
    if (u || data.users.length < 200) return u ?? null;
  }
  return null;
}

async function main() {
  for (const p of SEED_PRODUCTS) await db.insert(schema.products).values(p).onConflictDoNothing();
  if (!(await db.$count(schema.testOptions))) await db.insert(schema.testOptions).values(SEED_TESTS);
  for (const [pincode, city, state, waterTesting, deliveryDays] of PINS)
    await db.insert(schema.pincodes).values({ pincode, city, state, serviceable: true, installation: true, waterTesting, deliveryDays }).onConflictDoNothing();
  await db.insert(schema.coupons).values({ code: 'WELCOME5', type: 'percent', value: 5, maxDiscount: P(2000), appliesTo: ['hyper'], active: true }).onConflictDoNothing();

  // Homepage & promotions: start with what is live on the site today.
  const content = JSON.parse(fs.readFileSync('supabase/seed/site-content.json', 'utf8'));
  const seeded = await db.insert(schema.settings).values({ key: 'site.content', value: content }).onConflictDoNothing().returning();
  console.log(seeded.length ? '✓ homepage promotions seeded (Diwali slide, ribbon, gifting card)' : '· homepage promotions already set — left as they are');

  // Blog: the five starter articles and the team's articles on other sites. Existing slugs are left as they are.
  const blog = await db.insert(schema.posts).values(SEED_POSTS.map(({ id: _id, updatedAt: _u, ...p }) => p)).onConflictDoNothing({ target: schema.posts.slug }).returning({ id: schema.posts.id });
  console.log(blog.length ? `✓ blog: ${blog.length} posts seeded` : '· blog posts already there — left as they are');

  // opening stock movements so the inventory history starts at a known point
  if (!(await db.$count(schema.stockMovements))) {
    for (const p of await db.select().from(schema.products))
      if (p.onHand > 0) await db.insert(schema.stockMovements).values({ productId: p.id, type: 'inward', qty: p.onHand, onHandAfter: p.onHand, reservedAfter: 0, reference: 'OPENING', note: 'Opening stock (placeholder)' });
  }

  // First admin: a Supabase Auth user (email pre-confirmed) linked to a staff row with the admin role.
  const email = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const pass = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (!email || pass.length < 12) {
    console.log('· no admin created: set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of 12+ characters, then run again');
  } else {
    let user = await findUser(email);
    if (!user) {
      const { data, error } = await auth.createUser({ email, password: pass, email_confirm: true, user_metadata: { name: 'DVINE Admin' } });
      if (error) throw error;
      user = data.user;
    }
    const existing = await db.query.staff.findFirst({ where: eq(schema.staff.email, email) });
    if (!existing) await db.insert(schema.staff).values({ name: 'DVINE Admin', email, role: 'admin', authUserId: user!.id });
    else if (!existing.authUserId) await db.update(schema.staff).set({ authUserId: user!.id }).where(eq(schema.staff.id, existing.id));
    console.log(`✓ admin ${email} — sign in at /admin, then set up an authenticator app. Remove SEED_ADMIN_PASSWORD from your env afterwards.`);
  }
  const n = await db.$count(schema.products);
  console.log(`✓ seeded: ${n} products, ${SEED_TESTS.length} test options, ${PINS.length} pincodes`);
}

main().then(() => client.end()).catch(async e => { console.error(e); await client.end(); process.exit(1); });
