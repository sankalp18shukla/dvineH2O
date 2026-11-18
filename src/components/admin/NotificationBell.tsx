'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './AdminIcon';
import type { AdminNote } from '@/lib/admin-notifications';

const COOKIE = 'dv_admin_seen';
const POLL_MS = 45_000;

function ago(at: number) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60_000));
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Bell in the admin top bar. A dot shows when something arrived since this browser last opened it;
 * opening it lists the latest form responses, orders, service requests and reviews (no pop-ups).
 */
export function NotificationBell({ initial, seenAt: initialSeen }: { initial: AdminNote[]; seenAt: number }) {
  const [notes, setNotes] = useState(initial);
  const [seenAt, setSeenAt] = useState(initialSeen);
  // while the panel is open, keep highlighting what was new when it opened
  const [shownSince, setShownSince] = useState(initialSeen);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const unread = notes.filter(n => n.at > seenAt).length;

  useEffect(() => { setNotes(initial); }, [initial]);

  useEffect(() => {
    const load = () => {
      if (document.hidden) return;
      fetch('/api/admin/notifications', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => { if (d?.notes) setNotes(d.notes); }).catch(() => {});
    };
    const t = setInterval(load, POLL_MS);
    document.addEventListener('visibilitychange', load);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', load); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const now = Date.now();
    setShownSince(seenAt);
    setSeenAt(now);
    document.cookie = `${COOKIE}=${now}; path=/admin; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
    setOpen(true);
  };

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="true"
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        className={`relative grid size-10 place-items-center rounded-lg text-[#3B4766] transition-colors hover:bg-[#EEF1F6] hover:text-ink ${open ? 'bg-[#EEF1F6] text-ink' : ''}`}>
        <Icon name="bell" className="size-[19px]" />
        {unread > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-flash ring-2 ring-white" aria-hidden="true" />}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications"
          className="fixed inset-x-3 top-[60px] z-50 overflow-hidden rounded-xl border border-line bg-white font-sans shadow-[0_12px_40px_-12px_rgb(4_22_74/.25)] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[14px] font-semibold text-ink">Notifications</p>
            <span className="text-[12px] text-muted">Last 30 days</span>
          </div>
          {notes.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">Nothing new yet. Form responses, orders and service requests will show here.</p>
          ) : (
            <ul className="max-h-[min(440px,65vh)] divide-y divide-line/70 overflow-y-auto">
              {notes.map(n => {
                const isNew = n.at > shownSince;
                return (
                  <li key={n.id}>
                    <Link href={n.href} onClick={() => setOpen(false)} className={`flex gap-3 px-4 py-3 hover:bg-[#F6F8FC] ${isNew ? 'bg-[#F5F9FF]' : ''}`}>
                      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${isNew ? 'bg-[#E3EEFE] text-deep-current' : 'bg-[#F0F2F7] text-[#52607E]'}`}><Icon name={n.icon} className="size-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13.5px] ${isNew ? 'font-semibold text-ink' : 'font-medium text-[#24304F]'}`}>{n.title}</span>
                        <span className="block truncate text-[12.5px] text-muted">{n.sub}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5 text-[11.5px] text-muted">{ago(n.at)}{isNew && <span className="size-1.5 rounded-full bg-deep-current" aria-label="New" />}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/admin/enquiries" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-2.5 text-[13px] font-medium text-deep-current hover:bg-[#F6F8FC]">
            All form responses <Icon name="chevron" className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
