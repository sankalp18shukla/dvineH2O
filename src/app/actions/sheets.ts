'use server';
import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { parseSheetLink } from '@/lib/google-sheets';
import { FEEDS, feedOf, getLinks, linkFeeds, syncFeed, syncFeeds, unlinkFeed } from '@/lib/sheet-sync';
import type { FormState } from '@/lib/validators';

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const fail = (e: unknown): FormState => ({ ok: false, message: e instanceof Error ? e.message : 'Something went wrong.' });
const refresh = () => { revalidatePath('/admin/settings/sheets'); revalidatePath('/admin/enquiries'); revalidatePath('/admin/settings/pincodes'); };

/** The pasted link, or an already-linked spreadsheet picked from the list. */
function sheetFrom(fd: FormData) {
  const picked = str(fd, 'existing');
  const pasted = str(fd, 'link');
  const p = pasted ? parseSheetLink(pasted) : picked ? { id: picked } : null;
  if (!p) return { error: pasted ? 'That doesn’t look like a Google Sheets link. Open the sheet and copy the address from the browser bar.' : 'Paste the link to a Google Sheet.' };
  return { id: p.id };
}

export async function linkSheet(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireStaff('settings');
  const feed = str(fd, 'feed');
  const f = feedOf(feed);
  if (!f) return { ok: false, message: 'Unknown list.' };
  const sheet = sheetFrom(fd);
  if ('error' in sheet) return { errors: { link: sheet.error! } };
  try {
    const r = await linkFeeds(sheet.id, [{ feed, tab: str(fd, 'tab') }], s.name);
    await audit(s.id, 'sheet.link', 'settings', feed, { spreadsheetId: sheet.id });
    const sync = await syncFeed(feed);
    refresh();
    return sync.ok
      ? { ok: true, message: `${f.label} linked to “${r.title}”. ${sync.message.replace(`${f.label}: `, '')}` }
      : { ok: false, message: `Linked to “${r.title}”, but the first sync failed: ${sync.message}` };
  } catch (e) { return fail(e); }
}

/** One spreadsheet for everything not linked yet: one tab per form and record list. */
export async function linkAll(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireStaff('settings');
  const sheet = sheetFrom(fd);
  if ('error' in sheet) return { errors: { link: sheet.error! } };
  try {
    const linked = await getLinks();
    const feeds = FEEDS.filter(f => !linked.has(f.key) && (f.direction === 'out' || fd.get('pincodes') === 'on')).map(f => f.key);
    if (!feeds.length) return { ok: true, message: 'Everything already has a sheet.' };
    const r = await linkFeeds(sheet.id, feeds.map(feed => ({ feed })), s.name);
    await audit(s.id, 'sheet.link_all', 'settings', undefined, { spreadsheetId: sheet.id, feeds });
    after(() => syncFeeds(feeds, { quiet: true }));
    refresh();
    return { ok: true, message: `${feeds.length} lists linked to “${r.title}”, one tab each. The tabs are filling now; refresh in a minute.` };
  } catch (e) { return fail(e); }
}

export async function syncSheet(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireStaff('settings');
  const feed = str(fd, 'feed');
  const r = feed === 'all' ? await syncAllNow() : await syncFeed(feed);
  await audit(s.id, 'sheet.sync', 'settings', feed);
  refresh();
  return r;
}

async function syncAllNow() {
  const out = (await syncFeeds()) ?? [];
  const bad = out.filter(r => !r.ok);
  if (!out.length) return { ok: true, message: 'No sheets are linked yet.' };
  return bad.length ? { ok: false, message: `${out.length - bad.length} of ${out.length} synced. ${bad[0].message}` } : { ok: true, message: `All ${out.length} sheets are up to date.` };
}

export async function unlinkSheet(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireStaff('settings');
  const feed = str(fd, 'feed');
  await unlinkFeed(feed);
  await audit(s.id, 'sheet.unlink', 'settings', feed);
  refresh();
  return { ok: true, message: `${feedOf(feed)?.label ?? 'List'} unlinked. The sheet itself is untouched.` };
}
