import s from './Cited.module.css';

/** A phrase of some copy (matched exactly) linked to the paper that supports it; the PDF opens in a new tab. */
export type Ref = { text: string; href: string; label: string };

/** Splits copy into plain runs and cited phrases, in reading order. */
export function splitCited(text: string, refs: Ref[] = []) {
  const parts: { text: string; ref?: Ref }[] = [];
  let rest = text;
  while (rest) {
    const hit = refs.map(r => ({ r, at: rest.indexOf(r.text) })).filter(h => h.at >= 0).sort((a, b) => a.at - b.at)[0];
    if (!hit) { parts.push({ text: rest }); break; }
    if (hit.at > 0) parts.push({ text: rest.slice(0, hit.at) });
    parts.push({ text: hit.r.text, ref: hit.r });
    rest = rest.slice(hit.at + hit.r.text.length);
  }
  return parts;
}

/** The annotation itself, for light surfaces: dotted underline and a numbered pin. */
export function CiteLink({ r, n, children }: { r: Ref; n: number; children: React.ReactNode }) {
  return (
    <a href={r.href} target="_blank" rel="noopener" className={s.cite} title={r.label}
      aria-label={`${r.text}: ${r.label}, opens in a new tab`}>
      <span className={s.text}>{children}</span><sup className={s.mark} aria-hidden="true">{n}</sup>
    </a>
  );
}

/** Copy with its cited phrases annotated; `start` is the number of the first citation. */
export function Cited({ text, refs, start = 1 }: { text: string; refs?: Ref[]; start?: number }) {
  let n = start;
  return <>{splitCited(text, refs).map((p, i) => p.ref ? <CiteLink key={i} r={p.ref} n={n++}>{p.text}</CiteLink> : p.text)}</>;
}
