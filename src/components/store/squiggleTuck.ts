/**
 * The stage squiggle runs over the disc and tucks its tail behind it (ProductStage, PageStage). Two copies of the
 * line: the back one under the disc, the front one over it. The front copy is drawn only up to the last point
 * where the line is still clear of the disc, so the hand-over between the copies falls on the white, where the
 * two identical strokes meet unseen, and the tail then slips under the disc's rim. The product stands above both.
 *
 * `tuck` measures that point (again on resize) and returns `draw(p)`, which shows the line from 0 to p (0–1) on both
 * copies, for the load-in's draw-on. Call `draw(1)` for the line at rest.
 */
export function tuck(back: SVGPathElement, front: SVGPathElement, disc: HTMLElement, rim = 0) {
  const len = back.getTotalLength();
  let cut = len, at = 1;
  const measure = () => {
    const m = back.getScreenCTM(), d = disc.getBoundingClientRect();
    if (!m || !d.width) return;
    const cx = d.left + d.width / 2, cy = d.top + d.height / 2;
    // clear of the disc by half the stroke (13 viewBox units), plus any white rim around it
    const r = d.width / 2 + rim + 6.5 * Math.hypot(m.a, m.b) + 2;
    cut = len;
    for (let l = len; l >= 0; l -= 2) {
      const p = back.getPointAtLength(l), x = m.a * p.x + m.c * p.y + m.e, y = m.b * p.x + m.d * p.y + m.f;
      if (Math.hypot(x - cx, y - cy) > r) { cut = l; break; }
      if (l < 2) cut = 0;
    }
    draw(at);
  };
  const draw = (p: number) => {
    at = p;
    const d = p * len;
    back.style.strokeDasharray = `${d} ${len + 1}`;
    front.style.strokeDasharray = `${Math.min(d, cut)} ${len + 1}`;
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(disc);
  return { draw, stop: () => ro.disconnect() };
}
