import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { settings } from './db/schema';
import { getStaff } from './auth';
import { DEFAULT_CONTENT, parseContent, type SiteContent } from './site-content';

/** The published document is what visitors see; the draft is what the editor saves until "Publish". */
const LIVE = 'site.content', DRAFT = 'site.content.draft';

async function read(key: string): Promise<SiteContent | null> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  return row ? parseContent(row.value) : null;
}

/** Published content. Without a database (frontend-only preview) the site renders its designed defaults. */
export const getLiveContent = cache(async (): Promise<SiteContent> => (await read(LIVE).catch(() => null)) ?? DEFAULT_CONTENT);

/** For ?preview=1: a signed-in staff member sees the unpublished draft, everyone else the live site. */
export async function getContent(preview?: string | string[]): Promise<SiteContent> {
  if (preview === '1' && (await getStaff().catch(() => null))) {
    const d = await read(DRAFT).catch(() => null);
    if (d) return d;
  }
  return getLiveContent();
}

export async function getEditorContent() {
  const [live, draft] = await Promise.all([read(LIVE), read(DRAFT)]);
  return { live: live ?? DEFAULT_CONTENT, draft: draft ?? live ?? DEFAULT_CONTENT, hasDraft: !!draft };
}

const put = (key: string, value: unknown) =>
  db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });

export async function saveDraft(c: SiteContent) { await put(DRAFT, c); }
export async function publish(c: SiteContent) { await put(LIVE, c); await db.delete(settings).where(eq(settings.key, DRAFT)); }
export async function discardDraft() { await db.delete(settings).where(eq(settings.key, DRAFT)); }
