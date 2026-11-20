import 'server-only';
import crypto from 'node:crypto';

/**
 * Minimal Google Sheets client (no SDK): a Google Cloud service account signs a JWT, swaps it for an
 * access token, and calls the Sheets v4 REST API. Each sheet the team links must be shared with the
 * service account's email as an Editor.
 *
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL = dvine-sheets@<project>.iam.gserviceaccount.com
 *   GOOGLE_SERVICE_ACCOUNT_KEY   = the "private_key" from the JSON key file (\n escapes are fine)
 * or GOOGLE_SERVICE_ACCOUNT_JSON = the whole JSON key file (raw or base64)
 */

export type Cell = string | number;

export class SheetError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}

function account(): { email: string; key: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      const j = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
      if (j.client_email && j.private_key) return { email: j.client_email, key: j.private_key };
    } catch { /* fall through to the split variables */ }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n').trim();
  return email && key ? { email, key } : null;
}

/** The address each linked sheet must be shared with, or null when Google isn't set up on this deploy. */
export const sheetsEmail = () => account()?.email ?? null;

const g = globalThis as unknown as { __dvineGoogleToken?: { value: string; exp: number } };

async function accessToken() {
  if (g.__dvineGoogleToken && g.__dvineGoogleToken.exp > Date.now() + 60_000) return g.__dvineGoogleToken.value;
  const a = account();
  if (!a) throw new SheetError('Google Sheets isn’t switched on for this website yet.');
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: a.email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  let sig: string;
  try { sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(a.key, 'base64url'); }
  catch { throw new SheetError('The Google key on this website is not valid.'); }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
    signal: AbortSignal.timeout(15_000),
  });
  const j = await res.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !j.access_token) throw new SheetError(`Google sign-in failed${j.error_description ? `: ${j.error_description}` : ''}.`, res.status);
  g.__dvineGoogleToken = { value: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function api<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string> } = {}): Promise<T> {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: { authorization: `Bearer ${await accessToken()}`, ...(init.body ? { 'content-type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  if (res.ok) return res.json() as Promise<T>;
  const j = await res.json().catch(() => ({})) as { error?: { message?: string } };
  const who = sheetsEmail();
  if (res.status === 403) throw new SheetError(`The website can’t edit this sheet. In Google Sheets, click Share and add ${who ?? 'the website’s Google account'} as an Editor.`, 403);
  if (res.status === 404) throw new SheetError('That Google Sheet doesn’t exist, or the link is incomplete.', 404);
  if (res.status === 429) throw new SheetError('Google is busy right now. Try again in a minute.', 429);
  throw new SheetError(j.error?.message ? `Google Sheets: ${j.error.message}` : `Google Sheets error ${res.status}.`, res.status);
}

/** Accepts a full Google Sheets link (any tab) or the bare spreadsheet id. */
export function parseSheetLink(input: string): { id: string; gid?: number } | null {
  const s = input.trim();
  const m = s.match(/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]{20,})/);
  const id = m?.[1] ?? (/^[a-zA-Z0-9-_]{30,}$/.test(s) ? s : null);
  if (!id) return null;
  const gid = s.match(/[#&?]gid=(\d+)/)?.[1];
  return { id, gid: gid ? Number(gid) : undefined };
}

export const sheetUrl = (id: string, gid?: number) => `https://docs.google.com/spreadsheets/d/${id}/edit${gid !== undefined ? `#gid=${gid}` : ''}`;

/** A1 reference to a tab, quoted so names with spaces or apostrophes work. */
export const tabRange = (tab: string, cells = '') => `'${tab.replace(/'/g, "''")}'${cells ? `!${cells}` : ''}`;

export function colLetter(n: number) { // 1 → A, 27 → AA
  let s = '';
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

type Meta = { properties: { title: string }; sheets: { properties: { sheetId: number; title: string } }[] };

export async function getSpreadsheet(id: string) {
  const m = await api<Meta>(id, { query: { fields: 'properties.title,sheets.properties(sheetId,title)' } });
  return { title: m.properties.title, tabs: m.sheets.map(s => s.properties) };
}

/**
 * Finds each tab by name, creating the missing ones in one go (bold, frozen header row), so linking
 * many forms at once stays well inside Google's per-minute limits. Returns the tab ids for deep links.
 */
export async function ensureTabs(id: string, specs: { tab: string; header: string[] }[]) {
  const meta = await getSpreadsheet(id);
  const ids = new Map(meta.tabs.map(t => [t.title, t.sheetId]));
  const missing = specs.filter((s, i) => !ids.has(s.tab) && specs.findIndex(o => o.tab === s.tab) === i);
  if (missing.length) {
    const r = await api<{ replies: { addSheet: { properties: { sheetId: number; title: string } } }[] }>(`${id}:batchUpdate`, {
      method: 'POST', body: { requests: missing.map(s => ({ addSheet: { properties: { title: s.tab, gridProperties: { frozenRowCount: 1, columnCount: Math.max(26, s.header.length) } } } })) },
    });
    for (const rep of r.replies) ids.set(rep.addSheet.properties.title, rep.addSheet.properties.sheetId);
    await writeRows(id, missing.map(s => ({ range: tabRange(s.tab, 'A1'), values: [s.header] })));
    await api(`${id}:batchUpdate`, {
      method: 'POST', body: { requests: missing.map(s => ({ repeatCell: { range: { sheetId: ids.get(s.tab), startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat.textFormat.bold' } })) },
    });
  }
  return { title: meta.title, tabId: (tab: string) => ids.get(tab) };
}

/** Cell values as the sheet holds them (numbers stay numbers), trailing blanks trimmed by Google. */
export async function readTab(id: string, tab: string, lastCol: number): Promise<Cell[][]> {
  const r = await api<{ values?: Cell[][] }>(`${id}/values/${encodeURIComponent(tabRange(tab, `A1:${colLetter(lastCol)}`))}`, { query: { valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'FORMATTED_STRING' } });
  return r.values ?? [];
}

/** Writes values exactly as given (RAW): phone numbers like +91… and pincodes stay text, never formulas. */
export async function writeRows(id: string, data: { range: string; values: Cell[][] }[]) {
  for (let i = 0; i < data.length; i += 500) {
    await api(`${id}/values:batchUpdate`, { method: 'POST', body: { valueInputOption: 'RAW', data: data.slice(i, i + 500) } });
  }
}

export async function appendRows(id: string, tab: string, values: Cell[][]) {
  for (let i = 0; i < values.length; i += 1000) {
    await api(`${id}/values/${encodeURIComponent(tabRange(tab, 'A1'))}:append`, {
      method: 'POST', query: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' }, body: { values: values.slice(i, i + 1000) },
    });
  }
}
