import Link from 'next/link';
import { sheetUrl } from '@/lib/google-sheets';
import type { SheetLink } from '@/lib/sheet-sync';
import { Icon } from './AdminIcon';

export const feedAnchor = (feed: string) => feed.replace(/[^a-z0-9]+/gi, '-');

/** "3 min ago" for sync times. */
export function ago(iso?: string | null) {
  const t = Date.parse(iso ?? '');
  if (!t) return 'not yet';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Header button: opens the linked Google Sheet tab, or goes to Settings › Google Sheets to link one. */
export function SheetButton({ feed, link, canLink = true }: { feed: string; link?: SheetLink | null; canLink?: boolean }) {
  if (link) return (
    <a href={sheetUrl(link.spreadsheetId, link.tabId)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"
      title={`${link.title} › ${link.tab}${link.lastError ? ` · Last sync failed: ${link.lastError}` : ` · Synced ${ago(link.lastSyncAt)}`}`}>
      <Icon name="sheet" className="size-4" />Open Google Sheet
      {link.lastError && <span className="size-1.5 rounded-full bg-[#D92D20]" aria-label="Last sync failed" />}
    </a>
  );
  if (!canLink) return null;
  return <Link href={`/admin/settings/sheets#${feedAnchor(feed)}`} className="btn btn-outline btn-sm"><Icon name="link" className="size-4" />Link a Google Sheet</Link>;
}
