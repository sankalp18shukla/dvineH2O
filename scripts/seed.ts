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

const client = createClient({ url: process.env.DATABASE_URL ?? 'file:./data/dvine.db', authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const db = drizzle(client, { schema });
const P = (rupees: number) => rupees * 100;

const PRODUCTS: (typeof schema.products.$inferInsert)[] = [
  {
    sku: 'DVH-HYP-01', slug: 'hyper', name: 'Hyper Hydrogen Water Bottle', shortName: 'Hyper', saleMode: 'cart',
    mrp: P(16999), price: P(14999), priceConfirmed: false, gstRate: 1800, hsn: '85167990',
    onHand: 40, reorderLevel: 10, trackSerials: false, requiresInstallation: false, warrantyMonths: 12, maxPerOrder: 10,
    tagline: 'A hydrogen water bottle to take along.',
    description: 'Hyper uses PEM electrolysis to generate dissolved molecular hydrogen in suitable drinking water.',
    specs: [
      { label: 'Technology', value: 'H2 Precision Infusion™ — PEM electrolysis' },
      { label: 'Electrodes', value: 'Platinum titanium anode and cathode, proton exchange membrane' },
      { label: 'Chamber', value: 'Borosilicate glass' },
      { label: 'Cup', value: 'Anodised aluminium' },
      { label: 'Modes', value: 'H2 Generation, Auto Clean, Standby' },
      { label: 'Controls', value: 'One-touch digital control panel, smart timer, auto shut-off' },
      { label: 'Battery', value: '2000 mAh (3.7 V / 7.4 Wh), USB-C rechargeable' },
    ],
    boxContents: ['Hyper bottle', 'USB-C charging cable', 'User guide'],
    images: ['/images/hyper.webp', '/images/hyper-water.webp', '/images/hyper-exploded.webp', '/images/bubbles.webp'],
  },
  {
    sku: 'DVH-CRY-01', slug: 'crystal', name: 'Crystal Home Water System', shortName: 'Crystal', saleMode: 'cart',
    mrp: P(169000), price: P(149000), priceConfirmed: false, gstRate: 1800, hsn: '84212190',
    onHand: 12, reorderLevel: 3, trackSerials: true, requiresInstallation: true, warrantyMonths: 60, maxPerOrder: 3,
    tagline: 'Quiet intelligence for the modern kitchen.',
    description: 'A home water system with five platinum-coated titanium plates, PureCore multi-stage filtration and four water modes.',
    specs: [
      { label: 'Engine', value: 'HydroCore 5-plate ionisation, platinum titanium' },
      { label: 'Water modes', value: 'Hot, Neutral, Alkaline, High-Alkaline' },
      { label: 'Filtration', value: 'PureCore Multi-Stage Filtration™ (sediment, nano, post carbon)' },
      { label: 'Interface', value: 'SmartFlow Touchscreen Display™ — pH, ORP and filter status' },
      { label: 'Installation', value: 'By DVINE-trained technician' },
      { label: 'Warranty', value: '5 years, DVINE Assured Care' },
      { label: 'Service', value: 'PAN India certified network' },
    ],
    boxContents: ['Crystal unit', 'Filter cartridges (fitted)', 'Installation kit', 'User manual and warranty card'],
    images: ['/images/crystal.webp', '/images/crystal-inside.webp', '/images/collection.webp'],
  },
  {
    sku: 'DVH-TTN-111', slug: 'titan', name: 'TitanForce 111', shortName: 'Titan', saleMode: 'enquiry',
    mrp: 0, price: 0, priceConfirmed: false, gstRate: 1800, hsn: '84212190', quoteNote: 'Priced on quotation after a site discussion.',
    onHand: 0, reorderLevel: 0, buildToOrder: true, trackSerials: true, requiresInstallation: true, warrantyMonths: 60, maxPerOrder: 1,
    tagline: 'Precision. In high volume.',
    description: 'Eleven platinum-coated titanium plates in a floor-standing system with a SmartFlow multi-mode display, designed for semi-commercial applications with greater water demand.',
    specs: [
      { label: 'Engine', value: 'HydroCore 11-plate ionisation, platinum titanium' },
      { label: 'Output', value: '120 litres per hour, continuous' },
      { label: 'Water modes', value: 'Multiple alkaline, Neutral, Functional' },
      { label: 'Interface', value: 'SmartFlow Multi-Mode Display™' },
      { label: 'Build', value: 'Semi-commercial grade, floor-standing' },
      { label: 'Warranty', value: '5 years, DVINE Assured Care' },
      { label: 'Best for', value: 'Offices, large residences, hospitality' },
    ],
    images: ['/images/titan.webp', '/images/titan-display.webp'],
  },
];

const TESTS: (typeof schema.testOptions.$inferInsert)[] = [
  { name: 'Essential drinking water test', summary: 'A quick check of the basics for household drinking water.', parameters: ['pH', 'TDS', 'Hardness', 'Chlorine'], collectionMethod: 'On-site test by a DVINE technician', turnaround: 'Same visit', price: P(0), sort: 1 },
  { name: 'Standard lab test', summary: 'A sample collected from your home and tested in a partner laboratory.', parameters: ['pH', 'TDS', 'Total hardness', 'Alkalinity', 'Chloride', 'Iron', 'Nitrate', 'Fluoride', 'Turbidity'], collectionMethod: 'Home sample collection', turnaround: '3–5 working days', price: P(999), sort: 2 },
  { name: 'Comprehensive lab test', summary: 'An extended panel including microbiological and heavy-metal parameters.', parameters: ['Everything in Standard', 'Total coliform', 'E. coli', 'Arsenic', 'Lead', 'Mercury', 'Sulphate', 'Manganese'], collectionMethod: 'Home sample collection (sterile kit)', turnaround: '5–7 working days', price: P(2499), sort: 3 },
];

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
