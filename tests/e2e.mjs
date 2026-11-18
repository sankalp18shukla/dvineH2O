// End-to-end smoke test of the main journeys. Run against a running server:
//   BASE=http://localhost:3000 node tests/e2e.mjs
// Needs test payments enabled (no gateway keys) and the seeded admin account (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
// With Supabase email confirmation on, set SUPABASE_URL + SUPABASE_SECRET_KEY so the test can confirm its own sign-up.
// Staff two-step sign-in: the test enrols / answers TOTP itself and keeps the secret in OUT/admin-totp.txt
// (or set ADMIN_TOTP_SECRET), or run the server with STAFF_MFA_REQUIRED=false (never in production).
import { chromium } from 'playwright';
import fs from 'node:fs';
import crypto from 'node:crypto';
const BASE = process.env.BASE ?? 'http://localhost:3000';
const OUT = process.env.OUT ?? 'tests/out/';
fs.mkdirSync(OUT, { recursive: true });
const PDF = OUT + 'sample-report.pdf';
fs.writeFileSync(PDF, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@dvineh2o.com', password: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026' };
const run = Date.now().toString().slice(-6);

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s) from a base32 secret. */
function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac('sha1', key).update(msg).digest(); const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
const SUPA = { url: (process.env.SUPABASE_URL ?? '').replace(/\/$/, ''), key: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY };
async function confirmEmail(email) {
  if (!SUPA.url || !SUPA.key) throw new Error('email confirmation is on: set SUPABASE_URL and SUPABASE_SECRET_KEY for the test');
  const h = { apikey: SUPA.key, Authorization: `Bearer ${SUPA.key}`, 'Content-Type': 'application/json' };
  const list = await (await fetch(`${SUPA.url}/auth/v1/admin/users?per_page=200`, { headers: h })).json();
  const u = (list.users ?? []).find(x => x.email === email); if (!u) throw new Error('sign-up user not found');
  const r = await fetch(`${SUPA.url}/auth/v1/admin/users/${u.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ email_confirm: true }) });
  if (!r.ok) throw new Error('could not confirm: ' + r.status);
}

const b = await chromium.launch({ executablePath: process.env.CHROME ?? undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
const p = await ctx.newPage();
const errors = [];
const watch = (pg, tag) => {
  pg.on('pageerror', e => errors.push(`${tag} pageerror ${pg.url()}: ${e.message}`));
  pg.on('response', r => { if (r.status() >= 500) errors.push(`${tag} HTTP ${r.status()} ${r.url()}`); });
};
watch(p, 'store');
const pages = { store: p };
let passed = 0, failed = 0;
const step = async (name, fn) => {
  try { await fn(); passed++; console.log('✓', name); }
  catch (e) { failed++; console.log('✗', name, '—', e.message.split('\n')[0]); for (const [k, pg] of Object.entries(pages)) await pg.screenshot({ path: OUT + `fail-${k}-` + name.replace(/\W+/g, '_') + '.png' }).catch(() => {}); }
};

let orderUrl = '';
const asha = { email: `asha.${run}@example.com`, phone: `98765${run.slice(-5)}` };
await step('Hyper page loads with price', async () => {
  await p.goto(BASE + '/hydrogen-bottles'); await p.getByRole('heading', { level: 1 }).waitFor();
  await p.getByText(/₹1[0-9],[0-9]{3}/).first().waitFor();
});
await step('Pincode check', async () => {
  await p.fill('#pin', '560001'); await p.getByRole('button', { name: 'Check' }).click();
  await p.getByText(/Delivers to Bengaluru/).waitFor();
});
await step('Add 2 Hyper to cart', async () => {
  await p.getByRole('button', { name: 'Increase quantity' }).first().click();
  await p.getByRole('button', { name: 'Add to cart' }).first().click();
  await p.getByText('Added to your cart.').waitFor();
});
await step('Cart + coupon WELCOME5', async () => {
  await p.goto(BASE + '/cart'); await p.getByText('Hyper Hydrogen Water Bottle').first().waitFor();
  await p.fill('#code', 'WELCOME5'); await p.getByRole('button', { name: 'Apply' }).click();
  await p.getByText('WELCOME5 code applied').waitFor();
});
await step('Checkout validation errors', async () => {
  await p.goto(BASE + '/checkout'); await p.getByRole('button', { name: /Continue to payment/ }).click();
  await p.getByText('Enter a valid email address').waitFor();
});
await step('Checkout submit (guest)', async () => {
  await p.fill('#f-email', asha.email); await p.fill('#f-phone', asha.phone);
  await p.fill('#f-name', 'Asha Verma'); await p.fill('#f-line1', '12 Lake View Road, Indiranagar');
  await p.fill('#f-pincode', '560001'); await p.fill('#f-city', 'Bengaluru'); await p.selectOption('#f-state', 'Karnataka');
  await p.check('#f-consent'); await p.getByRole('button', { name: /Continue to payment/ }).click();
  await p.waitForURL(/checkout\/pay/); await p.getByRole('heading', { name: 'Complete your payment.' }).waitFor();
});
await step('Payment failure then success (test gateway)', async () => {
  await p.getByRole('button', { name: /Pay .* securely/ }).click();
  await p.getByRole('button', { name: 'Simulate failure' }).click();
  await p.getByText(/Payment failed/).waitFor();
  await p.getByRole('button', { name: /Pay .* securely/ }).click();
  await p.selectOption('#tm', 'upi'); await p.getByRole('button', { name: 'Simulate success' }).click();
  await p.waitForURL(/\/order\/DV-/); await p.getByText(/Thank you, Asha/).waitFor();
  orderUrl = p.url();
  await p.screenshot({ path: OUT + 'order-confirmed.png', fullPage: true });
});
await step('Invoice renders', async () => {
  const link = await p.getByRole('link', { name: /GST invoice/ }).getAttribute('href');
  await p.goto(BASE + link); await p.getByRole('heading', { name: 'Tax Invoice' }).waitFor();
  await p.screenshot({ path: OUT + 'invoice.png', fullPage: true });
});
await step('Track order (guest lookup)', async () => {
  const number = orderUrl.match(/order\/(DV-[\d-]+)/)[1];
  await p.goto(BASE + '/track'); await p.fill('#f-number', number); await p.fill('#f-contact', asha.email);
  await p.getByRole('button', { name: 'Track My Order' }).click(); await p.waitForURL(/\/order\//);
});
await step('Crystal buy now → pay (GST invoice, installation)', async () => {
  await p.goto(BASE + '/home-water-systems'); await p.getByRole('button', { name: /Buy now/i }).first().click();
  await p.waitForURL(/\/checkout$/);
  await p.fill('#f-email', `rahul.${run}@example.com`); await p.fill('#f-phone', `91234${run.slice(-5)}`);
  await p.fill('#f-name', 'Rahul Mehta'); await p.fill('#f-line1', 'Flat 4B, Sea Breeze, Bandra West');
  await p.fill('#f-pincode', '400050'); await p.fill('#f-city', 'Mumbai'); await p.selectOption('#f-state', 'Maharashtra');
  await p.check('#wantGst'); await p.fill('#f-gstin', '27AAPFU0939F1ZV');
  await p.check('#f-consent'); await p.getByRole('button', { name: /Continue to payment/ }).click();
  await p.waitForURL(/checkout\/pay/); await p.getByRole('button', { name: /Pay .* securely/ }).click();
  await p.getByRole('button', { name: 'Simulate success' }).click(); await p.waitForURL(/\/order\//);
  await p.getByRole('heading', { name: 'Installation' }).waitFor();
});
await step('Titan consultation enquiry', async () => {
  await p.goto(BASE + '/for-business');
  const f = p.locator('#enquiry form');
  await f.locator('#f-name').fill('Priya Nair'); await f.locator('#f-phone').fill('9988776655'); await f.locator('#f-email').fill('priya@acme.example');
  await f.locator('#f-company').fill('Acme Offices'); await f.locator('#f-setting').selectOption('Office'); await f.locator('#f-users').fill('220');
  await f.locator('#f-consent').check(); await f.getByRole('button', { name: 'Request My Quote' }).click();
  await p.getByText(/Your reference is EQ-/).waitFor();
});
await step('Water test booking + payment', async () => {
  await p.goto(BASE + '/water-testing');
  const f = p.locator('#book');
  await f.locator('#f-pincode').fill('560034'); await f.getByRole('button', { name: 'Check availability' }).click();
  await p.getByText(/Water testing is available/).waitFor();
  await f.getByText('Standard lab test').click();
  await f.locator('#f-name').fill('Kiran Rao'); await f.locator('#f-phone').fill('9000011111'); await f.locator('#f-city').fill('Bengaluru');
  await f.locator('#f-address').fill('22 Koramangala 5th Block');
  await f.locator('#f-preferredDate').fill(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)); await f.locator('#f-slot').selectOption({ index: 1 });
  await f.locator('#f-consent').check(); await f.getByRole('button', { name: 'Confirm and Pay' }).click();
  await p.waitForURL(/booking\/WT-/); await p.getByRole('button', { name: /Pay .* securely/ }).click();
  await p.getByRole('button', { name: 'Simulate success' }).click();
  await p.getByRole('heading', { name: 'Your water test is requested.' }).waitFor();
});
await step('Report upload', async () => {
  await p.goto(BASE + '/water-testing');
  const f = p.locator('#upload form');
  await f.locator('#f-report').setInputFiles(PDF);
  await f.locator('#f-r-name').fill('Meera Shah'); await f.locator('#f-r-phone').fill('9811122233'); await f.locator('#f-r-consent').check();
  await f.getByRole('button', { name: 'Send My Report' }).click(); await p.getByText(/received your report/).waitFor();
});
await step('Support form → service ticket', async () => {
  await p.goto(BASE + '/support');
  const f = p.locator('#contact form');
  await f.locator('#f-topic').selectOption('Service request'); await f.locator('#f-product').selectOption('crystal');
  await f.locator('#f-name').fill('Rahul Mehta'); await f.locator('#f-contact').fill('9123456780'); await f.locator('#f-message').fill('Display shows a filter warning after two weeks.');
  await f.locator('#f-consent').check(); await f.getByRole('button', { name: 'Send Enquiry' }).click();
  await p.getByText(/service request number is SR-/).waitFor();
});
await step('Book a demo', async () => {
  await p.goto(BASE + '/book-demo?product=crystal');
  await p.fill('#f-name', 'Neha Gupta'); await p.fill('#f-phone', '9822233344'); await p.check('#f-consent');
  await p.getByRole('button', { name: 'Book My Demo' }).click(); await p.getByText(/Your reference is EQ-/).waitFor();
});
await step('Chat: bot answer + handover', async () => {
  await p.goto(BASE + '/support');
  await p.getByRole('button', { name: 'Chat with us' }).click();
  await p.fill('#chat-input', 'how do I book a water test'); await p.keyboard.press('Enter');
  await p.getByRole('link', { name: 'Book a test' }).waitFor();
  await p.getByRole('button', { name: 'Talk to a person' }).click();
  await p.fill('#chat-name', 'Dev Patel'); await p.fill('#chat-phone', '9876500000'); await p.getByRole('button', { name: 'Connect me' }).click();
  await p.getByText(/Connected to our team/).waitFor();
});
await step('Search', async () => { await p.goto(BASE + '/search?q=installation'); await p.getByText(/results? for/).waitFor(); });
await step('Policy + guide + 404', async () => {
  await p.goto(BASE + '/policies/warranty'); await p.getByRole('heading', { name: 'Warranty' }).waitFor();
  await p.goto(BASE + '/support/hyper'); await p.getByRole('heading', { name: 'Hyper', level: 1 }).waitFor();
  const r = await p.goto(BASE + '/no-such-page'); if (r.status() !== 404) throw new Error('expected 404');
});
await step('Register account (claims guest orders)', async () => {
  await p.goto(BASE + '/account/register');
  await p.fill('#f-name', 'Asha Verma'); await p.fill('#f-email', asha.email); await p.fill('#f-phone', asha.phone); await p.fill('#f-password', 'longpassword1');
  await p.check('#f-consent'); await p.getByRole('button', { name: 'Create account' }).click();
  const outcome = await Promise.race([p.waitForURL(/\/account(\?|$)/).then(() => 'in'), p.getByText(/Almost there/).waitFor().then(() => 'confirm')]);
  if (outcome === 'confirm') {
    await confirmEmail(asha.email);
    await p.goto(BASE + '/account/login'); await p.fill('#f-identifier', asha.email); await p.fill('#f-password', 'longpassword1');
    await p.getByRole('button', { name: 'Sign in' }).click(); await p.waitForURL(/\/account(\?|$)/);
  }
  await p.getByText(/Hello, Asha/).waitFor(); await p.getByText(/DV-\d{2}-\d{6}/).first().waitFor();
  await p.screenshot({ path: OUT + 'account.png', fullPage: true });
});
for (const path of ['/account/orders', '/account/warranties', '/account/service', '/account/bookings', '/account/referrals', '/account/profile'])
  await step('Account page ' + path, async () => { const r = await p.goto(BASE + path); if (r.status() >= 400) throw new Error('status ' + r.status()); await p.getByText(/Hello, Asha/).waitFor(); });

const a = await ctx.newPage(); watch(a, 'admin'); pages.admin = a;
await step('Admin login', async () => {
  await a.goto(BASE + '/admin'); await a.waitForURL(/admin\/login/);
  await a.fill('#f-email', ADMIN.email); await a.fill('#f-password', ADMIN.password); await a.getByRole('button', { name: 'Continue' }).click();
  await a.waitForURL(/\/admin(\/login\/mfa)?$/);
  if (a.url().endsWith('/mfa')) {
    const store = OUT + 'admin-totp.txt';
    let secret = process.env.ADMIN_TOTP_SECRET ?? (fs.existsSync(store) ? fs.readFileSync(store, 'utf8').trim() : '');
    const setup = a.getByRole('button', { name: 'Set up authenticator' });
    if (await setup.isVisible()) {
      await setup.click(); await a.getByText('Can’t scan?').click();
      secret = (await a.locator('details code').textContent()).trim(); fs.writeFileSync(store, secret);
    }
    if (!secret) throw new Error('admin has an authenticator: set ADMIN_TOTP_SECRET');
    await a.fill('#f-code', totp(secret)); await a.getByRole('button', { name: 'Verify and sign in' }).click();
    await a.waitForURL(BASE + '/admin');
  }
  await a.getByRole('heading', { name: 'Overview' }).waitFor();
  await a.screenshot({ path: OUT + 'admin-overview.png', fullPage: true });
});
await step('Admin: ship + deliver Hyper order', async () => {
  const number = orderUrl.match(/order\/(DV-[\d-]+)/)[1];
  await a.goto(BASE + `/admin/orders?q=${number}`); await a.getByRole('link', { name: number }).click();
  await a.getByRole('heading', { name: number }).waitFor();
  await a.locator('form[data-ready]').first().waitFor();
  const manual = a.locator('form', { hasText: 'Manual shipment' });
  await manual.getByLabel('Courier').fill('Blue Dart'); await manual.getByLabel('AWB').fill('BD' + run + 'IN');
  await manual.getByRole('button', { name: 'Create shipment' }).click(); await a.getByText('Shipment created and order marked packed.').waitFor();
  for (const st of ['in_transit', 'delivered']) {
    await a.reload(); await a.locator('form[data-ready]').first().waitFor(); await a.getByLabel('Shipment status').selectOption(st);
    await a.locator('form', { has: a.getByLabel('Shipment status') }).getByRole('button', { name: 'Update', exact: true }).click(); await a.getByText('Saved.').first().waitFor();
  }
  await a.reload(); await a.locator('text=Delivered').first().waitFor();
});
await step('Admin: partial refund + credit note', async () => {
  a.once('dialog', d => d.accept());
  const f = a.locator('form', { hasText: 'Refund via' });
  await f.getByLabel('Amount in rupees').fill('500'); await f.getByLabel('Reason').fill('Goodwill');
  await f.getByRole('button', { name: /Refund via/ }).click(); await a.getByText('Refund recorded.').waitFor();
  await a.reload(); await a.getByText(/Credit note DVH\/CN/).waitFor();
  await a.screenshot({ path: OUT + 'admin-order.png', fullPage: true });
});
await step('Customer: review delivered order', async () => {
  const number = orderUrl.match(/order\/(DV-[\d-]+)/)[1];
  await p.goto(BASE + `/account/orders/${number}`);
  await p.getByRole('button', { name: '5 stars' }).click(); await p.fill('textarea[name=body]', 'Easy to use and my water tastes great.');
  await p.getByRole('button', { name: 'Submit review' }).click(); await p.getByText('Awaiting moderation').waitFor();
});
await step('Admin: approve review', async () => {
  await a.goto(BASE + '/admin/reviews'); await a.getByRole('button', { name: 'Approve' }).first().click(); await a.waitForTimeout(800);
  await p.goto(BASE + '/hydrogen-bottles#reviews'); await p.getByText('Easy to use and my water tastes great.').waitFor();
});
await step('Admin: reply to live chat → customer sees it', async () => {
  await a.goto(BASE + '/admin/enquiries?type=chat'); await a.getByRole('link', { name: /EQ-/ }).first().click();
  await a.getByLabel('Reply').fill('Hi Dev, happy to help.'); await a.getByRole('button', { name: 'Send' }).click();
  await a.getByText('Reply sent.').waitFor();
  await p.goto(BASE + '/support'); await p.getByRole('button', { name: 'Chat with us' }).click();
  await p.getByText('Hi Dev, happy to help.').waitFor({ timeout: 12000 });
});
for (const path of ['/admin/products', '/admin/products/1', '/admin/inventory', '/admin/customers', '/admin/customers/1', '/admin/enquiries', '/admin/enquiries/1', '/admin/water-tests', '/admin/water-tests/1', '/admin/payments', '/admin/payments?tab=refunds', '/admin/service', '/admin/service?tab=installations', '/admin/service?tab=warranties', '/admin/reviews', '/admin/marketing', '/admin/reports', '/admin/notifications', '/admin/audit', '/admin/settings', '/admin/settings/pincodes', '/admin/settings/staff', '/admin?range=today'])
  await step('Admin page ' + path, async () => { const r = await a.goto(BASE + path); if (r.status() >= 400) throw new Error('status ' + r.status()); await a.locator('main h1').first().waitFor(); });
await step('Admin: stock inward', async () => {
  await a.goto(BASE + '/admin/inventory');
  const f = a.locator('form', { hasText: 'Record movement' }).first(); await f.getByLabel('Quantity').fill('5'); await f.getByLabel('Reference').fill('PO-' + run);
  await f.getByRole('button', { name: 'Record movement' }).click(); await a.getByText('Stock updated.').first().waitFor();
});
await step('Admin: CSV exports', async () => {
  const t = await (await a.request.get(BASE + '/api/admin/export?type=orders&range=30d')).text();
  if (!t.includes('DV-')) throw new Error('no orders in export');
  const t2 = await (await a.request.get(BASE + '/api/admin/export?type=invoices&range=30d')).text();
  if (!t2.includes('DVH/')) throw new Error('no invoices in export');
});
await step('Security: admin + exports blocked when signed out', async () => {
  const anon = await b.newContext();
  const r = await anon.request.get(BASE + '/api/admin/export?type=orders', { maxRedirects: 0 }); if (r.status() !== 403) throw new Error('export not blocked: ' + r.status());
  const pg = await anon.newPage(); await pg.goto(BASE + '/admin/orders'); if (!pg.url().includes('/admin/login')) throw new Error('admin not protected');
  const f = await anon.request.get(BASE + '/api/admin/files/1'); if (f.status() !== 404) throw new Error('report file exposed');
  const m = await anon.request.post(BASE + '/api/admin/media', { data: { action: 'sign', name: 'x.png', size: 10, type: 'image/png' } }); if (m.status() !== 403) throw new Error('media upload not blocked: ' + m.status());
  const h = (await anon.request.get(BASE + '/')).headers();
  for (const k of ['content-security-policy', 'x-content-type-options', 'referrer-policy', 'x-frame-options']) if (!h[k]) throw new Error('missing header ' + k);
  if (h['x-powered-by']) throw new Error('x-powered-by is exposed');
  const acct = (await anon.request.get(BASE + '/account/login')).headers(); if (!acct['cache-control']?.includes('no-store')) throw new Error('account pages are cacheable');
  const tr = await anon.request.get(BASE + '/order/DV-00-000001?t=wrong', { maxRedirects: 0 }); if (tr.status() !== 404) throw new Error('order page answered a wrong token: ' + tr.status());
  await anon.close();
});

console.log(`\n${passed} passed, ${failed} failed`);
console.log('Runtime errors:', errors.length ? '\n' + [...new Set(errors)].join('\n') : 'none');
await b.close();
process.exit(failed ? 1 : 0);
