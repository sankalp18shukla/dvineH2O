/**
 * Seeds the 3 SKUs, water-test options, serviceable pincodes, default settings and the first admin.
 * Safe to re-run: existing rows are left as they are.
 *
 * ⚠ Prices, stock, test prices and pincodes below are PLACEHOLDERS for development.
 *   Confirm them with DVINE and edit in Admin › Products / Water tests / Pincodes before launch.
 */
import './env';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import * as schema from '../src/lib/db/schema';
import { SEED_PRODUCTS, SEED_TESTS } from '../src/lib/seed-data';

const client = createClient({ url: process.env.DATABASE_URL ?? 'file:./data/dvine.db', authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const db = drizzle(client, { schema });
const P = (rupees: number) => rupees * 100;

const PRODUCTS = SEED_PRODUCTS, TESTS = SEED_TESTS;

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

async function main() {
  for (const p of PRODUCTS) await db.insert(schema.products).values(p).onConflictDoNothing();
  const count = await db.$count(schema.testOptions);
  if (!count) await db.insert(schema.testOptions).values(TESTS);
  for (const [pincode, city, state, waterTesting, deliveryDays] of PINS)
    await db.insert(schema.pincodes).values({ pincode, city, state, serviceable: true, installation: true, waterTesting, deliveryDays }).onConflictDoNothing();
  await db.insert(schema.coupons).values({ code: 'WELCOME5', type: 'percent', value: 5, maxDiscount: P(2000), appliesTo: ['hyper'], active: true }).onConflictDoNothing();

  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@dvineh2o.com').toLowerCase();
  const pass = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';
  await db.insert(schema.staff).values({ name: 'DVINE Admin', email, passwordHash: await bcrypt.hash(pass, 11), role: 'admin' }).onConflictDoNothing();

  // opening stock movements so the inventory history starts at a known point
  const prods = await db.select().from(schema.products);
  for (const p of prods) {
    const n = await db.$count(schema.stockMovements);
    if (n >= prods.length) break;
    if (p.onHand > 0) await db.insert(schema.stockMovements).values({ productId: p.id, type: 'inward', qty: p.onHand, onHandAfter: p.onHand, reservedAfter: 0, reference: 'OPENING', note: 'Opening stock (placeholder)' });
  }
  console.log(`✓ seeded: ${prods.length} products, ${TESTS.length} test options, ${PINS.length} pincodes, admin ${email}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
