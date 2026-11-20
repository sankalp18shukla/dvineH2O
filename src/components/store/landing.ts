import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Arriving by a link to a section (a button to /water-testing#book, "Upload My Report", "Ask Us a Question")
 * lands on it at rest: the section is marked [data-landed] and its entrances (TagReveal, PinFrames, ScrollCopy,
 * Reveal) are skipped or finished. Reaching the same section by scrolling plays them as usual.
 */
export const LANDED = 'data-landed';

/** ScrollTrigger id given to every shared entrance, so a landing can finish the ones in its section. */
export const ENTER = 'enter';

/** Landed on, or inside [data-still] (copy that is always shown at rest, like a product page's heading). */
export const isLanded = (e: Element) => !!e.closest(`[${LANDED}], [data-still]`);

/** The element a #hash points at, if it is on this page. */
export function hashTarget(hash = location.hash): HTMLElement | null {
  if (hash.length < 2) return null;
  try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return null; }
}

/** Marks the section holding `target` as landed and finishes any entrance already set up inside it. */
export function land(target: HTMLElement) {
  const sec = target.closest<HTMLElement>('section') ?? target;
  if (sec.closest('[data-own-motion]')) return sec;
  sec.setAttribute(LANDED, '');
  for (const st of ScrollTrigger.getAll()) {
    const t = st.trigger;
    if (st.vars.id !== ENTER || !(t instanceof Element) || !sec.contains(t)) continue;
    const a = st.animation;
    st.kill(false, true);
    a?.progress(1);
  }
  sec.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('in'));
  return sec;
}
