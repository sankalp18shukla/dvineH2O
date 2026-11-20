import { after } from 'next/server';

/**
 * Tells the linked Google Sheets that something changed. The sync runs after the response is sent, so a
 * slow or unreachable Google never delays a customer's form. Feeds without a linked sheet cost one
 * small settings read. Outside a request (seed and import scripts) this does nothing; the next sync
 * catches up.
 */
export function queueSheetSync(...feeds: string[]) {
  try {
    after(async () => {
      const { syncFeeds } = await import('./sheet-sync');
      await syncFeeds(feeds, { quiet: true });
    });
  } catch { /* not inside a request */ }
}

/** Pulls the pincode sheet in the background when the last pull is older than a few minutes. */
export function queuePincodeRefresh() {
  try {
    after(async () => {
      const { refreshPincodesIfStale } = await import('./sheet-sync');
      await refreshPincodesIfStale(10).catch(() => {});
    });
  } catch { /* not inside a request */ }
}
