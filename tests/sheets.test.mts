/**
 * Offline test of the Google Sheets sync: a fake Sheets API in memory, a throwaway service-account key.
 *   npx tsx --conditions=react-server tests/sheets.test.mts
 */
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'test@dvine-test.iam.gserviceaccount.com';
process.env.GOOGLE_SERVICE_ACCOUNT_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().replace(/\n/g, '\\n');

type Cell = string | number;
const tabs = new Map<string, { id: number; rows: Cell[][] }>([['Sheet1', { id: 0, rows: [] }]]);
let calls = 0;
const col = (s: string) => [...s].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
const parse = (r: string) => {
  const m = decodeURIComponent(r).match(/^'((?:[^']|'')+)'(?:!([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?)?$/)!;
  return { tab: m[1].replace(/''/g, "'"), c1: m[2] ? col(m[2]) : 1, r1: m[3] ? +m[3] : 1 };
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
const put = (tab: string, r1: number, c1: number, values: Cell[][]) => {
  const t = tabs.get(tab)!;
  values.forEach((row, i) => { const target = (t.rows[r1 - 1 + i] ??= []); row.forEach((v, j) => { target[c1 - 1 + j] = v; }); });
  for (let i = 0; i < t.rows.length; i++) t.rows[i] ??= [];
};

globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  calls++;
  const url = new URL(String(input));
  const body = init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
  if (url.host === 'oauth2.googleapis.com') {
    const jwt = new URLSearchParams(String(init!.body)).get('assertion')!.split('.');
    const ok = crypto.createVerify('RSA-SHA256').update(`${jwt[0]}.${jwt[1]}`).verify(publicKey, jwt[2], 'base64url');
    assert.ok(ok, 'JWT signature verifies with the public key');
    return json({ access_token: 'tok', expires_in: 3600 });
  }
  const path = url.pathname.replace('/v4/spreadsheets/', '');
  if (path === 'SHEET' && !init?.method?.match(/POST/)) return json({ properties: { title: 'DVINE responses' }, sheets: [...tabs].map(([title, t]) => ({ properties: { title, sheetId: t.id } })) });
  if (path === 'SHEET:batchUpdate') {
    const replies = body.requests.map((r: { addSheet?: { properties: { title: string } } }) => {
      if (!r.addSheet) return {};
      const id = tabs.size + 100; tabs.set(r.addSheet.properties.title, { id, rows: [] });
      return { addSheet: { properties: { sheetId: id, title: r.addSheet.properties.title } } };
    });
    return json({ replies });
  }
  if (path === 'SHEET/values:batchUpdate') {
    assert.equal(body.valueInputOption, 'RAW');
    for (const d of body.data) { const p = parse(d.range); put(p.tab, p.r1, p.c1, d.values); }
    return json({});
  }
  const m = path.match(/^SHEET\/values\/(.+?)(:append)?$/);
  if (m) {
    const p = parse(m[1]);
    const t = tabs.get(p.tab);
    if (!t) return json({ error: { message: `Unable to parse range: ${m[1]}` } }, 400);
    if (m[2]) { let last = t.rows.length; while (last > 0 && !t.rows[last - 1].some(c => c !== '' && c != null)) last--; put(p.tab, last + 1, 1, body.values); return json({}); }
    const rows = t.rows.map(r => { const c = [...r].map(v => v ?? ''); while (c.length && c[c.length - 1] === '') c.pop(); return c; });
    while (rows.length && !rows[rows.length - 1].length) rows.pop();
    return json({ values: rows });
  }
  return json({ error: { message: `unexpected ${path}` } }, 500);
}) as typeof fetch;

const { parseSheetLink, colLetter } = await import('../src/lib/google-sheets');
const { _internal } = await import('../src/lib/sheet-sync');

assert.deepEqual(parseSheetLink('https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit#gid=42'), { id: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789', gid: 42 });
assert.equal(parseSheetLink('https://example.com/nope'), null);
assert.equal(colLetter(1), 'A'); assert.equal(colLetter(26), 'Z'); assert.equal(colLetter(27), 'AA');

const link = { spreadsheetId: 'SHEET', title: 'DVINE responses', tab: "Demo bookings", connectedAt: '' };
const header = ['Reference', 'Name', 'Phone', 'Stage'];

// 1. tab missing → created with header, all rows appended
let r = await _internal.pushRows(link, header, [['EQ-1', 'Asha', '+919800000001', 'New'], ['EQ-2', 'Ravi', '+919800000002', 'New']]);
assert.equal(r.message, '2 added, 0 updated.');
assert.deepEqual(tabs.get('Demo bookings')!.rows, [header, ['EQ-1', 'Asha', '+919800000001', 'New'], ['EQ-2', 'Ravi', '+919800000002', 'New']]);

// 2. the team sorts rows and adds a notes column; then EQ-1 changes stage and EQ-3 arrives
const t = tabs.get('Demo bookings')!;
t.rows = [[...header, 'Notes'], ['EQ-2', 'Ravi', '+919800000002', 'New', 'call back Mon'], ['EQ-1', 'Asha', '+919800000001', 'New', 'VIP']];
r = await _internal.pushRows(link, header, [['EQ-1', 'Asha', '+919800000001', 'Contacted'], ['EQ-2', 'Ravi', '+919800000002', 'New'], ['EQ-3', 'Meera', '+919800000003', 'New']]);
assert.equal(r.message, '1 added, 1 updated.');
assert.deepEqual(t.rows, [[...header, 'Notes'], ['EQ-2', 'Ravi', '+919800000002', 'New', 'call back Mon'], ['EQ-1', 'Asha', '+919800000001', 'Contacted', 'VIP'], ['EQ-3', 'Meera', '+919800000003', 'New']]);

// 3. nothing changed → no writes
const before = calls;
r = await _internal.pushRows(link, header, [['EQ-1', 'Asha', '+919800000001', 'Contacted'], ['EQ-2', 'Ravi', '+919800000002', 'New'], ['EQ-3', 'Meera', '+919800000003', 'New']]);
assert.equal(r.message, 'Already up to date.');
assert.equal(calls - before, 1, 'only one read when nothing changed');

// 4. tab names with apostrophes
r = await _internal.pushRows({ ...link, tab: "Riya's list" }, ['Ref'], [['X-1']]);
assert.deepEqual(tabs.get("Riya's list")!.rows, [['Ref'], ['X-1']]);

console.log('✓ google sheets sync: 4 scenarios passed');
process.exit(0);
