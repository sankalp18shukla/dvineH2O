'use client';
import { useEffect } from 'react';

/**
 * Hover "roll" for every .btn: on first pointer-over, the label is cloned twice into an aria-hidden
 * overlay track. CSS slides the track right so the label exits right while its copy enters from the left.
 * The original children stay in place (just hidden), so React keeps owning them; a MutationObserver
 * re-clones when React changes the label (e.g. SubmitButton's pending text).
 */
export function ButtonRoll() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const observers = new Map<HTMLElement, MutationObserver>();

    const fill = (btn: HTMLElement, roll: HTMLElement) => {
      const nodes = Array.from(btn.childNodes).filter(n => n !== roll);
      roll.replaceChildren(...[0, 1].map(() => {
        const copy = document.createElement('span');
        copy.className = 'btn-roll-copy';
        nodes.forEach(n => copy.appendChild(n.cloneNode(true)));
        return copy;
      }));
    };

    const enhance = (btn: HTMLElement) => {
      const roll = document.createElement('span');
      roll.className = 'btn-roll';
      roll.setAttribute('aria-hidden', 'true');
      fill(btn, roll);
      // start un-hovered so the first hover transitions instead of snapping
      btn.classList.add('btn-roll-init', 'is-rolled');
      btn.appendChild(roll);
      void btn.offsetWidth;
      btn.classList.remove('btn-roll-init');
      const mo = new MutationObserver(records => {
        if (records.every(r => roll.contains(r.target) || r.target === roll)) return;
        if (!btn.contains(roll)) btn.appendChild(roll);
        fill(btn, roll);
      });
      mo.observe(btn, { childList: true, characterData: true, subtree: true });
      observers.set(btn, mo);
    };

    const onOver = (e: PointerEvent) => {
      const btn = (e.target as Element | null)?.closest?.<HTMLElement>('.btn');
      if (btn && !btn.classList.contains('is-rolled')) enhance(btn);
    };
    document.addEventListener('pointerover', onOver);
    return () => {
      document.removeEventListener('pointerover', onOver);
      observers.forEach(mo => mo.disconnect());
    };
  }, []);
  return null;
}
