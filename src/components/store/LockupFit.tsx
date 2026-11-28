'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Inner-page headline lockups (every page but the homepage, whose <main> is [data-home]). */
const SEL = 'main:not([data-home]) .lk';

/**
 * Keeps every inner-page headline to two lines: each block is set on one line (white-space: nowrap in
 * globals.css), and when the lockup would be wider than its column this scales its type down through --lk-fit
 * (every size and offset in the lockup is in em, so one measurement gives the exact factor). Re-fits when the
 * column changes width and once the web fonts have loaded.
 */
export function LockupFit() {
  const path = usePathname();
  useEffect(() => {
    const widths = new WeakMap<HTMLElement, number>();
    const fit = (l: HTMLElement) => {
      // measure at full size first: in a column that sizes to its content, measuring the scaled lockup would
      // only ever find room for the scaled size, and it would lock small
      l.style.setProperty('--lk-fit', '1');
      const w = l.clientWidth;
      if (!w) return;
      const blocks = Array.from(l.querySelectorAll<HTMLElement>(':scope > .lk-top, :scope > .lk-bot'));
      if (!blocks.length) return;
      const rs = blocks.map(b => b.getBoundingClientRect());
      // the pins hang 6px past each side
      const need = Math.max(...rs.map(r => r.right)) - Math.min(...rs.map(r => r.left)) + 12;
      if (need > w) l.style.setProperty('--lk-fit', String(Math.max(.35, Math.floor((w / need) * 1000) / 1000)));
      else l.style.removeProperty('--lk-fit');
      widths.set(l, l.clientWidth); // the settled width, so the observer doesn't re-fit on our own change
    };
    const all = () => document.querySelectorAll<HTMLElement>(SEL).forEach(fit);
    const ro = new ResizeObserver(entries => entries.forEach(e => {
      const l = e.target as HTMLElement;
      if (widths.get(l) !== l.clientWidth) fit(l); // height changes from our own re-fit are ignored
    }));
    const watch = (l: HTMLElement) => { fit(l); ro.observe(l); };
    document.querySelectorAll<HTMLElement>(SEL).forEach(watch);
    document.fonts?.ready.then(all);
    // headlines that arrive after this ran (a section streamed in late, or swapped in by a hot reload) were never
    // fitted, so they sat at full size over whatever was beside them
    const mo = new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(n => {
      if (!(n instanceof HTMLElement)) return;
      if (n.matches(SEL)) watch(n);
      n.querySelectorAll<HTMLElement>(SEL).forEach(watch);
    })));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [path]);
  return null;
}
