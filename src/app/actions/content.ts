'use server';
import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { SiteContentSchema } from '@/lib/site-content';
import { discardDraft, publish, saveDraft } from '@/lib/site-content.server';

type Result = { ok: boolean; message: string };

/** Saves the editor's document as a draft (visible at /?preview=1 to staff) or publishes it to the live site. */
export async function saveSiteContent(json: string, mode: 'draft' | 'publish'): Promise<Result> {
  const s = await requireStaff('content');
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return { ok: false, message: 'Could not read the changes. Reload and try again.' }; }
  const parsed = SiteContentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Some fields are not valid. Check the highlighted sections.' };
  try {
    if (mode === 'publish') {
      await publish(parsed.data);
      await audit(s.id, 'content.publish', 'settings', 'site.content');
      revalidatePath('/', 'layout');
      return { ok: true, message: 'Published. The changes are live on the website.' };
    }
    await saveDraft(parsed.data);
    await audit(s.id, 'content.draft', 'settings', 'site.content');
    return { ok: true, message: 'Draft saved. Only staff can see it in the preview.' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not save.' };
  }
}

export async function discardSiteDraft(): Promise<Result> {
  const s = await requireStaff('content');
  await discardDraft();
  await audit(s.id, 'content.discard', 'settings', 'site.content');
  return { ok: true, message: 'Draft discarded.' };
}
