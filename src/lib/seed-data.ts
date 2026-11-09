/**
 * The placeholder catalogue: the 3 SKUs and the water-test options. scripts/seed.ts writes these to the database;
 * the store falls back to them when there is no database at all (a frontend-only preview deploy).
 *
 * ⚠ Prices, stock and test prices are PLACEHOLDERS. Confirm with DVINE and edit in Admin before launch.
 */
import type * as schema from './db/schema';

const P = (rupees: number) => rupees * 100;

export const SEED_PRODUCTS: (typeof schema.products.$inferInsert)[] = [
  {
    sku: 'DVH-HYP-01', slug: 'hyper', name: 'Hyper Hydrogen Water Bottle', shortName: 'Hyper', saleMode: 'cart',
    mrp: P(16999), price: P(14999), priceConfirmed: false, gstRate: 1800, hsn: '85167990',
    onHand: 40, reorderLevel: 10, trackSerials: false, requiresInstallation: false, warrantyMonths: 12, maxPerOrder: 10,
    tagline: 'A hydrogen water bottle to take along.',
    description: 'Hyper uses PEM electrolysis to generate dissolved molecular hydrogen in suitable drinking water.',
    specs: [
      { label: 'Technology', value: 'H2 Precision Infusion™ — PEM electrolysis' },
      // every row is from the master catalogue's Hyper spread. Cycle time is left out on purpose: the catalogue says
      // both "in under three minutes" and "complete in under 5 minutes"; add it once the client confirms one.
      { label: 'Electrodes', value: 'Platinum titanium anode and cathode' },
      { label: 'Membrane', value: 'SPE/PEM proton exchange membrane, titanium core' },
      { label: 'Chamber', value: 'Borosilicate glass' },
      { label: 'Cup', value: 'Anodised aluminium' },
      { label: 'Housing', value: 'Leak-proof, durable body for daily and travel use; BPA-free Tritan' },
      { label: 'Modes', value: 'H2 Generation, Auto Clean, Standby' },
      { label: 'Controls', value: 'One-touch digital control panel, smart timer, auto shut-off' },
      { label: 'Indicator', value: 'LED indicator' },
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

export const SEED_TESTS: (typeof schema.testOptions.$inferInsert)[] = [
  { name: 'Essential drinking water test', summary: 'A quick check of the basics for household drinking water.', parameters: ['pH', 'TDS', 'Hardness', 'Chlorine'], collectionMethod: 'On-site test by a DVINE technician', turnaround: 'Same visit', price: P(0), sort: 1 },
  { name: 'Standard lab test', summary: 'A sample collected from your home and tested in a partner laboratory.', parameters: ['pH', 'TDS', 'Total hardness', 'Alkalinity', 'Chloride', 'Iron', 'Nitrate', 'Fluoride', 'Turbidity'], collectionMethod: 'Home sample collection', turnaround: '3–5 working days', price: P(999), sort: 2 },
  { name: 'Comprehensive lab test', summary: 'An extended panel including microbiological and heavy-metal parameters.', parameters: ['Everything in Standard', 'Total coliform', 'E. coli', 'Arsenic', 'Lead', 'Mercury', 'Sulphate', 'Manganese'], collectionMethod: 'Home sample collection (sterile kit)', turnaround: '5–7 working days', price: P(2499), sort: 3 },
];
