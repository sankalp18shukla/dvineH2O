import 'server-only';
import { asc, count, eq, inArray, like, sql } from 'drizzle-orm';
import { db } from './db';
import { settings, enquiries, waterTests, reportUploads, serviceTickets, orders, customers, reviews, pincodes, type ENQUIRY_TYPES } from './db/schema';
import { FORMS } from './form-responses';
import { INTEREST_LABEL } from './enquiries';
import { appendRows, colLetter, ensureTabs, getSpreadsheet, readTab, SheetError, tabRange, writeRows, type Cell } from './google-sheets';

/**
 * Google Sheets links. Every website form and record list can be linked to a tab in a Google Sheet:
 *  - "out" feeds copy rows from the website into the sheet, one row per response, keyed by the reference
 *    in column A. New rows are appended and changed rows (stage, status, owner…) are rewritten in place,
 *    so the team can sort, filter and add their own columns to the right without breaking anything.
 *  - the "in" feed (serviceable pincodes) works the other way: the sheet is the master list.
 * Links live in dvine.settings under `sheet:<feed>`.
 */

type EnquiryType = typeof ENQUIRY_TYPES[number];

export type SheetLink = {
  spreadsheetId: string; title: string; tab: string; tabId?: number;
  connectedAt: string; connectedBy?: string;
  lastSyncAt?: string; lastError?: string | null; lastErrorAt?: string; note?: string | null; rows?: number;
};

export type Feed = { key: string; label: string; about: string; group: 'forms' | 'records' | 'lists'; tab: string; icon: string; direction: 'out' | 'in'; header: string[] };

/* ───────────── formatting ───────────── */
const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
const t = (x: unknown): string => (x == null ? '' : String(x).slice(0, 45_000)); // Google caps a cell at 50,000 characters
const when = (d?: Date | null) => d ? d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const label = (s?: string | null) => !s ? '' : s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
const rupees = (paise?: number | null) => (paise == null ? '' : Math.round(paise) / 100);
const yes = (b?: boolean | null) => (b ? 'Yes' : 'No');

/* ───────────── form responses ───────────── */
type EnquiryRow = typeof enquiries.$inferSelect & { assignee: { name: string } | null; files: number; booking?: typeof waterTests.$inferSelect & { option: { name: string } | null } };
type Col = [string, (e: EnquiryRow, d: Record<string, unknown>) => Cell];

const HEAD: Col[] = [['Reference', e => e.ref], ['Received', e => when(e.createdAt)], ['Name', e => e.name], ['Phone', e => t(e.phone)], ['Email', e => t(e.email)], ['City', e => t(e.city)]];
const TAIL: Col[] = [['Message', e => t(e.message)], ['Stage', e => label(e.status)], ['Owner', e => t(e.assignee?.name)], ['Sent from', e => t(e.source)], ['Open in admin', e => `${SITE()}/admin/enquiries/${e.id}`]];
const product: Col = ['Product', e => INTEREST_LABEL[e.productInterest] ?? ''];
const files: Col = ['Photos / files', e => e.files || ''];
const data = (h: string, k: string): Col => [h, (_, d) => t(d[k])];

const FORM_COLS: Record<EnquiryType, Col[]> = {
  consultation: [['Company', e => t(e.company)], data('Setting', 'setting'), data('Locations', 'locations'), data('Daily users', 'users'), data('Peak demand', 'peak'), data('Water source', 'waterSource'), data('Timeline', 'timeline'), files],
  distributorship: [['Business name', e => t(e.company)], data('Partner type', 'partnerType'), product, data('Territory', 'territory'), data('GSTIN', 'gstin')],
  demo: [product, data('Demo type', 'demoMode'), ['Pincode', e => t(e.pincode)], ['Preferred time', e => t(e.preferredAt)]],
  product: [product, files],
  bulk: [['Company', e => t(e.company)], product, data('Quantity', 'quantity'), data('GSTIN', 'gstin')],
  water_test: [
    ['Kind', (e, d) => e.booking ? 'Test booking' : d.reportUpload ? 'Report upload' : 'Water test'],
    ['Booking ref', e => t(e.booking?.ref)], ['Test', (e, d) => t(e.booking?.option?.name ?? d.test)], ['Address', e => t(e.booking?.address)], ['Pincode', e => t(e.pincode ?? e.booking?.pincode)],
    ['Date & slot', e => t(e.preferredAt)], ['Water source', (e, d) => t(e.booking?.waterSource ?? d.waterSource)], ['Sample', e => label(e.booking?.sampleType)],
    ['Booking status', e => label(e.booking?.status)], ['Payment', e => label(e.booking?.paymentStatus === 'not_required' ? 'no payment' : e.booking?.paymentStatus)],
    ['Report date', (_, d) => t(d.testDate)], files, product,
  ],
  support: [product],
  chat: [['Conversation', (_, d) => t(((d.transcript as { from: string; text: string }[] | undefined) ?? []).map(m => `${m.from === 'user' ? 'Customer' : m.from === 'agent' ? 'DVINE' : 'Assistant'}: ${m.text}`).join('\n'))]],
  general: [product, ['Company', e => t(e.company)]],
};
const formCols = (type: EnquiryType) => [...HEAD, ...FORM_COLS[type], ...TAIL];

async function formRows(type: EnquiryType): Promise<Cell[][]> {
  const list = await db.query.enquiries.findMany({ where: eq(enquiries.type, type), orderBy: asc(enquiries.createdAt), with: { assignee: { columns: { name: true } } } });
  const fileCounts = await db.select({ id: reportUploads.enquiryId, n: count() }).from(reportUploads).innerJoin(enquiries, eq(enquiries.id, reportUploads.enquiryId)).where(eq(enquiries.type, type)).groupBy(reportUploads.enquiryId);
  const nFiles = new Map(fileCounts.map(f => [f.id, f.n]));
  const bookings = type === 'water_test' && list.length
    ? new Map((await db.query.waterTests.findMany({ with: { option: { columns: { name: true } } } })).filter(w => w.enquiryId).map(w => [w.enquiryId!, w]))
    : new Map();
  const cols = formCols(type);
  return list.map(e => {
    const row: EnquiryRow = { ...e, files: nFiles.get(e.id) ?? 0, booking: bookings.get(e.id) };
    const d = (e.data ?? {}) as Record<string, unknown>;
    return cols.map(([, f]) => f(row, d));
  });
}

/* ───────────── store records ───────────── */
const ORDER_HEAD = ['Order no.', 'Created', 'Paid on', 'Customer', 'Phone', 'Email', 'City', 'State', 'Pincode', 'Items', 'Subtotal (₹)', 'Discount (₹)', 'Shipping (₹)', 'Total (₹)', 'Payment', 'Status', 'Coupon', 'Customer note', 'Open in admin'];
async function orderRows(): Promise<Cell[][]> {
  const list = await db.query.orders.findMany({ orderBy: asc(orders.createdAt), with: { items: { columns: { name: true, qty: true } } } });
  return list.map(o => [
    o.number, when(o.createdAt), when(o.placedAt), o.contactName, o.contactPhone, o.contactEmail, t(o.shippingAddress?.city), t(o.shippingAddress?.state), t(o.shippingAddress?.pincode),
    o.items.map(i => `${i.name} × ${i.qty}`).join(', '), rupees(o.subtotal), rupees(o.discount), rupees(o.shipping), rupees(o.total),
    label(o.paymentStatus), label(o.status), t(o.couponCode), t(o.customerNote), `${SITE()}/admin/orders/${o.id}`,
  ]);
}

const TICKET_HEAD = ['Ticket no.', 'Opened', 'Name', 'Phone', 'Email', 'Product', 'Issue', 'Priority', 'Status', 'Engineer', 'Action taken', 'Parts used', 'Resolved on', 'Rating', 'Feedback'];
async function ticketRows(): Promise<Cell[][]> {
  const list = await db.query.serviceTickets.findMany({ orderBy: asc(serviceTickets.createdAt), with: { product: { columns: { name: true } }, assignee: { columns: { name: true } } } });
  return list.map(s => [s.number, when(s.createdAt), t(s.name), t(s.phone), t(s.email), t(s.product?.name), t(s.issue), label(s.priority), label(s.status), t(s.assignee?.name), t(s.actionTaken), t(s.partsUsed), when(s.resolvedAt), s.rating ?? '', t(s.feedback)]);
}

const CUSTOMER_HEAD = ['Customer no.', 'First seen', 'Name', 'Phone', 'Email', 'City', 'State', 'Pincode', 'Has an account', 'Updates by email', 'Orders', 'Open in admin'];
async function customerRows(): Promise<Cell[][]> {
  const [list, counts] = await Promise.all([
    db.query.customers.findMany({ orderBy: asc(customers.id) }),
    db.select({ id: orders.customerId, n: count() }).from(orders).groupBy(orders.customerId),
  ]);
  const n = new Map(counts.map(c => [c.id, c.n]));
  return list.map(c => [`CU-${String(c.id).padStart(5, '0')}`, when(c.createdAt), c.name, t(c.phone), t(c.email), t(c.city), t(c.state), t(c.pincode), yes(!!c.authUserId), yes(c.consentMarketing), n.get(c.id) ?? 0, `${SITE()}/admin/customers/${c.id}`]);
}

const REVIEW_HEAD = ['Review no.', 'Submitted', 'Product', 'Customer', 'Rating', 'Title', 'Review', 'Photos', 'Verified buyer', 'Status'];
async function reviewRows(): Promise<Cell[][]> {
  const list = await db.query.reviews.findMany({ orderBy: asc(reviews.createdAt), with: { product: { columns: { name: true } }, customer: { columns: { name: true } } } });
  return list.map(r => [`RV-${String(r.id).padStart(5, '0')}`, when(r.createdAt), t(r.product?.name), t(r.customer?.name), r.rating, t(r.title), t(r.body), (r.media ?? []).join('\n'), yes(r.verified), label(r.status)]);
}

/* ───────────── serviceable pincodes (sheet → website) ───────────── */
const PIN_HEAD = ['Pincode', 'City', 'State', 'Delivery days', 'Delivers', 'Installation', 'Water testing'];
async function pinRows(): Promise<Cell[][]> {
  const list = await db.query.pincodes.findMany({ orderBy: asc(pincodes.pincode) });
  return list.map(p => [p.pincode, p.city, p.state, p.deliveryDays, yes(p.serviceable), yes(p.installation), yes(p.waterTesting)]);
}

/* ───────────── the feed catalogue ───────────── */
export const FEEDS: Feed[] = [
  ...FORMS.map(f => ({ key: `form:${f.type}`, label: f.tab, about: f.from, group: 'forms' as const, tab: f.tab, icon: f.icon, direction: 'out' as const, header: formCols(f.type).map(([h]) => h) })),
  { key: 'orders', label: 'Orders', about: 'Every order placed on the website, with payment and delivery status', group: 'records', tab: 'Orders', icon: 'box', direction: 'out', header: ORDER_HEAD },
  { key: 'tickets', label: 'Service requests', about: 'Service, warranty and installation requests from the support page', group: 'records', tab: 'Service requests', icon: 'wrench', direction: 'out', header: TICKET_HEAD },
  { key: 'customers', label: 'Customers', about: 'Everyone who has ordered, enquired or made an account', group: 'records', tab: 'Customers', icon: 'users', direction: 'out', header: CUSTOMER_HEAD },
  { key: 'reviews', label: 'Reviews', about: 'Product reviews from customers, with their status', group: 'records', tab: 'Reviews', icon: 'star', direction: 'out', header: REVIEW_HEAD },
  { key: 'pincodes', label: 'Serviceable pincodes', about: 'Where we deliver, install and test water. The sheet is the master list: edit it there and the website follows.', group: 'lists', tab: 'Serviceable pincodes', icon: 'pin', direction: 'in', header: PIN_HEAD },
];
export const feedOf = (key: string) => FEEDS.find(f => f.key === key);

const ROWS: Record<string, () => Promise<Cell[][]>> = {
  ...Object.fromEntries(FORMS.map(f => [`form:${f.type}`, () => formRows(f.type)])),
  orders: orderRows, tickets: ticketRows, customers: customerRows, reviews: reviewRows, pincodes: pinRows,
};

/* ───────────── stored links ───────────── */
const KEY = (feed: string) => `sheet:${feed}`;

export async function getLinks(): Promise<Map<string, SheetLink>> {
  const rows = await db.select().from(settings).where(like(settings.key, 'sheet:%'));
  return new Map(rows.map(r => [r.key.slice(6), r.value as SheetLink]));
}
export async function getLink(feed: string) {
  const r = await db.query.settings.findFirst({ where: eq(settings.key, KEY(feed)) });
  return (r?.value as SheetLink | undefined) ?? null;
}
/** Updates a link's status only if it still exists, so a sync finishing after "Unlink" can't bring it back. */
async function saveStatus(feed: string, patch: Partial<SheetLink>) {
  const cur = await getLink(feed);
  if (cur) await db.update(settings).set({ value: { ...cur, ...patch } }).where(eq(settings.key, KEY(feed)));
}

/* ───────────── sync engine ───────────── */
/** One sync per feed at a time (across server instances), so two forms sent together can't add a row twice. */
async function withLock<T>(feed: string, fn: () => Promise<T>): Promise<T> {
  return db.transaction(async tx => {
    await tx.execute(sql`set local statement_timeout = '60s'`);
    await tx.execute(sql`set local idle_in_transaction_session_timeout = '180s'`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`dvine-sheet:${feed}`}))`);
    return fn();
  });
}

const norm = (c: Cell | boolean | null | undefined) => (c == null ? '' : String(c));
const sameRow = (a: Cell[] | undefined, b: Cell[], n: number) => { for (let j = 0; j < n; j++) if (norm(a?.[j]) !== norm(b[j])) return false; return true; };

async function readOrCreate(link: SheetLink, header: string[]) {
  try { return await readTab(link.spreadsheetId, link.tab, header.length); }
  catch (e) {
    if (!(e instanceof SheetError) || e.status !== 400) throw e; // 400 = the tab was renamed or deleted: make it again
    await ensureTabs(link.spreadsheetId, [{ tab: link.tab, header }]);
    return [header];
  }
}

/** Website → sheet: rewrite the rows that changed, append the ones that are missing. Keyed by column A. */
async function pushRows(link: SheetLink, header: string[], rows: Cell[][]) {
  const n = header.length;
  const existing = await readOrCreate(link, header);
  const updates: { range: string; values: Cell[][] }[] = [];
  const headerFix = !sameRow(existing[0], header, n);
  if (headerFix) updates.push({ range: tabRange(link.tab, `A1:${colLetter(n)}1`), values: [header] });
  const at = new Map<string, number>();
  existing.forEach((r, i) => { if (i > 0 && norm(r[0])) at.set(norm(r[0]), i); });
  const add: Cell[][] = [];
  for (const row of rows) {
    const i = at.get(norm(row[0]));
    if (i === undefined) add.push(row);
    else if (!sameRow(existing[i], row, n)) updates.push({ range: tabRange(link.tab, `A${i + 1}:${colLetter(n)}${i + 1}`), values: [row] });
  }
  if (updates.length) await writeRows(link.spreadsheetId, updates);
  if (add.length) await appendRows(link.spreadsheetId, link.tab, add);
  const changed = updates.length - (headerFix ? 1 : 0);
  return { total: rows.length, message: add.length || changed ? `${add.length} added, ${changed} updated.` : 'Already up to date.' };
}

const yesNo = (c: Cell | undefined, fallback: boolean) => {
  const s = norm(c).trim().toLowerCase();
  if (!s) return fallback;
  return /^(y|yes|true|1|✓|✔|available|on)$/.test(s);
};

/** Sheet → website: the sheet's pincodes replace the website's list. An empty sheet is filled from the website instead. */
async function pullPincodes(link: SheetLink) {
  const existing = await readOrCreate(link, PIN_HEAD);
  const body = existing.slice(1).map((r, i) => ({ r, row: i + 2 })).filter(({ r }) => r.some(c => norm(c).trim()));
  if (!body.length) {
    const r = await pushRows(link, PIN_HEAD, await pinRows());
    return { total: r.total, note: null, message: `The sheet was empty, so it now holds the website’s ${r.total} pincodes.` };
  }
  const want = new Map<string, typeof pincodes.$inferInsert>();
  const bad: number[] = [];
  for (const { r, row } of body) {
    const pin = norm(r[0]).replace(/\s/g, '');
    const city = norm(r[1]).trim(); const state = norm(r[2]).trim();
    if (!/^[1-9]\d{5}$/.test(pin) || !city || !state) { bad.push(row); continue; }
    const days = Math.round(Number(norm(r[3])));
    want.set(pin, { pincode: pin, city, state, deliveryDays: days > 0 && days < 100 ? days : 5, serviceable: yesNo(r[4], true), installation: yesNo(r[5], true), waterTesting: yesNo(r[6], false) });
  }
  if (!want.size) throw new SheetError('No valid pincodes were found in the sheet, so nothing was changed. Each row needs a 6-digit pincode, a city and a state.');

  const current = new Map((await db.query.pincodes.findMany()).map(p => [p.pincode, p]));
  const upsert = [...want.values()].filter(w => {
    const c = current.get(w.pincode);
    return !c || c.city !== w.city || c.state !== w.state || c.deliveryDays !== w.deliveryDays || c.serviceable !== w.serviceable || c.installation !== w.installation || c.waterTesting !== w.waterTesting;
  });
  const remove = [...current.keys()].filter(p => !want.has(p));
  for (let i = 0; i < upsert.length; i += 500) {
    await db.insert(pincodes).values(upsert.slice(i, i + 500)).onConflictDoUpdate({
      target: pincodes.pincode,
      set: { city: sql`excluded.city`, state: sql`excluded.state`, deliveryDays: sql`excluded.delivery_days`, serviceable: sql`excluded.serviceable`, installation: sql`excluded.installation`, waterTesting: sql`excluded.water_testing` },
    });
  }
  for (let i = 0; i < remove.length; i += 500) {
    const chunk = remove.slice(i, i + 500);
    try { await db.delete(pincodes).where(inArray(pincodes.pincode, chunk)); }
    catch {
      // before migration 20261120000001 the website's role can't delete pincodes: switch them off instead
      await db.update(pincodes).set({ serviceable: false, installation: false, waterTesting: false }).where(inArray(pincodes.pincode, chunk));
    }
  }
  const added = upsert.filter(u => !current.has(u.pincode)).length;
  const note = bad.length ? `${bad.length} row${bad.length === 1 ? '' : 's'} skipped (row ${bad.slice(0, 6).join(', ')}${bad.length > 6 ? '…' : ''}): each needs a 6-digit pincode, a city and a state.` : null;
  const changes = added + (upsert.length - added) + remove.length;
  return { total: want.size, note, message: changes ? `${added} added, ${upsert.length - added} updated, ${remove.length} removed.` : 'Already up to date.' };
}

export type SyncResult = { ok: boolean; message: string };

export async function syncFeed(feed: string): Promise<SyncResult> {
  const f = feedOf(feed);
  const link = f && await getLink(feed);
  if (!f || !link) return { ok: false, message: 'No sheet is linked to this yet.' };
  try {
    const r = await withLock(feed, async () => {
      if (f.direction === 'in') return pullPincodes(link);
      return { ...(await pushRows(link, f.header, await ROWS[feed]())), note: null };
    });
    await saveStatus(feed, { lastSyncAt: new Date().toISOString(), lastError: null, rows: r.total, note: r.note });
    return { ok: true, message: `${f.label}: ${r.message}` };
  } catch (e) {
    const message = e instanceof SheetError ? e.message : `Couldn’t sync with Google Sheets (${e instanceof Error ? e.message : 'unknown error'}).`;
    await saveStatus(feed, { lastError: message, lastErrorAt: new Date().toISOString() }).catch(() => {});
    if (!(e instanceof SheetError)) console.error('[sheets]', feed, e);
    return { ok: false, message };
  }
}

/** Syncs the given feeds that have a sheet linked (all linked feeds when none are named). */
export async function syncFeeds(feeds?: string[], opts: { quiet?: boolean } = {}) {
  const links = await getLinks().catch(() => new Map<string, SheetLink>());
  const todo = [...new Set(feeds ?? [...links.keys()])].filter(f => links.has(f));
  const out: SyncResult[] = [];
  for (const f of todo) out.push(await syncFeed(f));
  if (!opts.quiet) return out;
}

export async function refreshPincodesIfStale(minutes: number) {
  const link = await getLink('pincodes');
  if (!link) return;
  const last = Date.parse(link.lastSyncAt ?? '') || 0;
  if (Date.now() - last > minutes * 60_000) await syncFeed('pincodes');
}

/**
 * Admin edits to pincodes while a sheet is linked: take the sheet's latest first (so edits made there
 * aren't lost), apply the change, then write the result back to the sheet.
 */
export async function editPincodes<T>(apply: () => Promise<T>): Promise<T> {
  const link = await getLink('pincodes');
  if (!link) return apply();
  return withLock('pincodes', async () => {
    try { await pullPincodes(link); }
    catch (e) { throw new Error(`Nothing was changed: the pincode sheet couldn’t be read. ${e instanceof Error ? e.message : ''}`.trim()); }
    const result = await apply();
    const r = await pushRows(link, PIN_HEAD, await pinRows());
    await saveStatus('pincodes', { lastSyncAt: new Date().toISOString(), lastError: null, rows: r.total });
    return result;
  });
}

/* ───────────── linking ───────────── */
const cleanTab = (s: string) => s.replace(/[[\]*?:/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);

/**
 * Links feeds to tabs of one spreadsheet. Checks access, creates any missing tabs (with headers) in one
 * batch, and stores the links. Filling the tabs is left to the caller (inline for one, in the background for many).
 */
export async function linkFeeds(spreadsheetId: string, items: { feed: string; tab?: string }[], by: string) {
  const plan = items.map(i => {
    const f = feedOf(i.feed);
    if (!f) throw new Error('Unknown list.');
    return { f, tab: cleanTab(i.tab || f.tab) || f.tab };
  });
  const links = await getLinks();
  for (const p of plan) {
    const clash = [...links].find(([k, l]) => k !== p.f.key && l.spreadsheetId === spreadsheetId && l.tab === p.tab && !plan.some(q => q.f.key === k));
    if (clash) throw new Error(`The “${p.tab}” tab already holds ${feedOf(clash[0])?.label ?? 'another list'}. Choose a different tab name.`);
  }
  await getSpreadsheet(spreadsheetId); // clear "share it with…" message before anything is created
  const made = await ensureTabs(spreadsheetId, plan.map(p => ({ tab: p.tab, header: p.f.header })));
  const now = new Date().toISOString();
  for (const p of plan) {
    const value: SheetLink = { spreadsheetId, title: made.title, tab: p.tab, tabId: made.tabId(p.tab), connectedAt: now, connectedBy: by };
    await db.insert(settings).values({ key: KEY(p.f.key), value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  return { title: made.title, keys: plan.map(p => p.f.key) };
}

export async function unlinkFeed(feed: string) {
  await db.delete(settings).where(eq(settings.key, KEY(feed)));
}

/** For the offline sync test (tests/sheets.test.mts) only. */
export const _internal = { pushRows, ROWS };
