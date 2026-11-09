/**
 * Hand-drawn festive decorations, rendered as SVG instead of flat PNG stickers: clay diyas with a living flame,
 * paper kandils lit from inside, a marigold-and-mango-leaf toran, rice-light strings, a powder rangoli (with a
 * grain filter so it reads as coloured powder, not vector fill), bokeh glints and a firework.
 *
 * Saved decorations reference the old /decor/diwali/*.png paths, so the art is chosen by file name: every slide
 * or card that already uses them picks up the new drawings with no data change. Unknown sources stay <img>.
 */
import { useId, type CSSProperties, type ReactNode } from 'react';
import s from './DecorArt.module.css';

/** deterministic jitter, so server and client draw the same garland */
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const f = (n: number) => Math.round(n * 10) / 10;

/** point on a hanging string between a and b with sag `d` (quadratic catenary approximation) */
const hang = (ax: number, ay: number, bx: number, by: number, d: number, t: number) =>
  ({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t + 4 * d * t * (1 - t) });
const hangPath = (ax: number, ay: number, bx: number, by: number, d: number) =>
  `M${ax} ${ay} Q${(ax + bx) / 2} ${(ay + by) / 2 + 2 * d} ${bx} ${by}`;

const delay = (sec: number): CSSProperties => ({ animationDelay: `calc(${f(-sec)}s - var(--p, 0s))` });

/* ───────────── Diya: terracotta lamp, ghee surface, cotton wick, flickering flame ───────────── */
function Diya() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 200 150" className={s.svg} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}h`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFC56B" stopOpacity=".55" /><stop offset=".45" stopColor="#FF9A3C" stopOpacity=".18" /><stop offset="1" stopColor="#FF7A1A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}p`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFB45C" stopOpacity=".45" /><stop offset="1" stopColor="#FF8A2A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}b`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#4A1607" /><stop offset=".22" stopColor="#8E3A17" /><stop offset=".55" stopColor="#C2602F" />
          <stop offset=".78" stopColor="#E08A4E" /><stop offset="1" stopColor="#8A3313" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#1A0602" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" x2="1">
          <stop offset="0" stopColor="#7A2C10" /><stop offset=".6" stopColor="#D47A45" /><stop offset="1" stopColor="#FFC78F" />
        </linearGradient>
        <radialGradient id={`${id}o`} cx=".85" cy=".35" r=".9">
          <stop offset="0" stopColor="#FFE7A6" /><stop offset=".35" stopColor="#E3A33C" /><stop offset="1" stopColor="#6B3A08" />
        </radialGradient>
        <radialGradient id={`${id}f`} cx=".5" cy=".86" r=".75" fx=".5" fy=".92">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset=".22" stopColor="#FFF4C2" /><stop offset=".5" stopColor="#FFC24A" />
          <stop offset=".8" stopColor="#FF7A1A" stopOpacity=".85" /><stop offset="1" stopColor="#E0430E" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* light pool on the floor and halo around the flame */}
      <ellipse className={s.glow} style={delay(.4)} cx="104" cy="128" rx="96" ry="18" fill={`url(#${id}p)`} />
      <circle className={s.glow} style={delay(1.1)} cx="172" cy="34" r="80" fill={`url(#${id}h)`} />
      {/* bowl */}
      <path d="M30 80 C34 112 68 130 102 130 C134 130 164 112 172 80 Z" fill={`url(#${id}b)`} />
      <path d="M30 80 C34 112 68 130 102 130 C134 130 164 112 172 80 Z" fill={`url(#${id}s)`} />
      <ellipse cx="102" cy="131" rx="30" ry="3.4" fill="#1A0602" opacity=".5" />
      {/* hand-painted band: cream dots and little petals, as on a painted clay diya */}
      <path d="M44 100 C70 113 134 113 160 100" fill="none" stroke="#F6DDB0" strokeWidth="1.2" opacity=".55" />
      {Array.from({ length: 11 }, (_, k) => {
        const t = (k + .5) / 11, p = hang(44, 100, 160, 100, 6.5, t);
        return <g key={k} opacity={.85 - Math.abs(t - .55) * .7}>
          <circle cx={f(p.x)} cy={f(p.y + 6)} r="1.7" fill="#F6DDB0" />
          {k % 2 === 0 && <path d={`M${f(p.x)} ${f(p.y - 1)} q-3 -5 0 -9 q3 4 0 9z`} fill="#F0B23A" />}
        </g>;
      })}
      {/* rim, pinched into a spout on the right */}
      <path d="M28 80 C26 68 66 62 108 63 C140 64 168 64 190 66 C178 80 146 92 104 93 C62 93 30 90 28 80 Z" fill={`url(#${id}r)`} />
      <path d="M38 79 C38 71 72 68 106 69 C134 70 158 70 176 69 C166 78 140 85 104 86 C70 86 40 85 38 79 Z" fill={`url(#${id}o)`} />
      <path d="M40 76 C70 71 120 70 172 69" stroke="#FFF0C8" strokeOpacity=".55" strokeWidth="1.1" fill="none" />
      {/* wick */}
      <path d="M160 72 C166 70 171 67 175 62" stroke="#3A2414" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <circle cx="175.5" cy="61" r="2.2" fill="#1B0E06" />
      {/* flame: outer envelope, white core, blue root */}
      <g className={s.flameSway} style={delay(.7)}>
        <g className={s.flame} style={delay(0)}>
          <path d="M176 60 C163 52 164 32 176 2 C188 32 189 52 176 60 Z" fill={`url(#${id}f)`} />
          <path d="M176 58 C170 52 170 40 176 26 C182 40 182 52 176 58 Z" fill="#FFFDF2" opacity=".92" />
          <ellipse cx="176" cy="57" rx="3.4" ry="2.4" fill="#7FB2FF" opacity=".55" />
        </g>
      </g>
    </svg>
  );
}

/* ───────────── Akash kandil: crimson paper lantern lit from within, gold frame, silk tassels ───────────── */
function Lantern() {
  const id = useId().replace(/:/g, '');
  const strands = Array.from({ length: 13 }, (_, k) => 47 + k * 2.2);
  return (
    <svg viewBox="0 0 120 270" className={s.svg} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}p`} cx=".5" cy=".5" r=".62">
          <stop offset="0" stopColor="#FFF3C4" /><stop offset=".22" stopColor="#FFC15A" /><stop offset=".5" stopColor="#F2553E" />
          <stop offset=".8" stopColor="#A3123F" /><stop offset="1" stopColor="#560826" />
        </radialGradient>
        <radialGradient id={`${id}h`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FF9F5A" stopOpacity=".5" /><stop offset="1" stopColor="#FF5A6E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}g`} x1="0" x2="1">
          <stop offset="0" stopColor="#8A5A0B" /><stop offset=".45" stopColor="#FFE9A8" /><stop offset=".7" stopColor="#E0A526" /><stop offset="1" stopColor="#7A4C08" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#F2C14E" /><stop offset=".55" stopColor="#E0335C" /><stop offset="1" stopColor="#8E0E3A" stopOpacity=".2" />
        </linearGradient>
        <clipPath id={`${id}c`}><path d="M42 54 L78 54 L102 86 L102 144 L78 176 L42 176 L18 144 L18 86 Z" /></clipPath>
      </defs>
      <circle className={s.glow} style={delay(.3)} cx="60" cy="115" r="78" fill={`url(#${id}h)`} />
      <path d="M60 -400 V44" stroke="#C9A35A" strokeWidth="1.1" />
      <path d="M48 44 h24 l7 10 h-38 z" fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>
        <rect x="10" y="50" width="100" height="130" fill={`url(#${id}p)`} />
        {/* light leaking through the cut-paper lattice */}
        {Array.from({ length: 5 }, (_, k) => <path key={k} d={`M${28 + k * 16} 108 l6 7 l-6 7 l-6 -7z`} fill="#FFF0C0" opacity={k === 2 ? .95 : .55} />)}
        {Array.from({ length: 9 }, (_, k) => <circle key={k} cx={22 + k * 9.5} cy="96" r="1.5" fill="#FFE6A8" opacity=".7" />)}
        {Array.from({ length: 9 }, (_, k) => <circle key={k} cx={22 + k * 9.5} cy="134" r="1.5" fill="#FFE6A8" opacity=".7" />)}
        <path d="M42 54 L30 115 L42 176 M78 54 L90 115 L78 176" stroke="#5A0A22" strokeOpacity=".45" strokeWidth="2" fill="none" />
        <path d="M60 54 V176" stroke="#FFE2A0" strokeOpacity=".25" strokeWidth="1" />
        <path d="M18 86 H102 M18 144 H102" stroke={`url(#${id}g)`} strokeWidth="2.2" />
      </g>
      <path d="M42 54 L78 54 L102 86 L102 144 L78 176 L42 176 L18 144 L18 86 Z" fill="none" stroke={`url(#${id}g)`} strokeWidth="1.6" />
      <path d="M42 176 h36 l-7 10 h-22 z" fill={`url(#${id}g)`} />
      <circle cx="60" cy="191" r="4.2" fill={`url(#${id}g)`} />
      <g className={s.tassel} style={delay(1.3)}>
        {strands.map((x, k) => <path key={k} d={`M${f(60 + (x - 60) * .35)} 194 Q${f(x)} 215 ${f(x + (k % 3 - 1) * .8)} ${236 + (k % 4) * 5}`} stroke={`url(#${id}t)`} strokeWidth="1.05" fill="none" />)}
      </g>
      {[18, 102].map((x, k) => (
        <g key={x} className={s.tassel} style={delay(k * .9)}>
          {[-1.5, 0, 1.5].map(o => <path key={o} d={`M${x} 144 q${o} 14 ${o * 1.4} 30`} stroke={`url(#${id}t)`} strokeWidth=".9" fill="none" />)}
        </g>
      ))}
    </svg>
  );
}

/* ───────────── Marigold (genda) flower, shared by toran, garland and the single bloom ───────────── */
function MarigoldDefs({ id }: { id: string }) {
  const petals = (n: number, r: number, pr: number) =>
    Array.from({ length: n }, (_, k) => { const a = k / n * Math.PI * 2; return <circle key={k} cx={f(Math.cos(a) * r)} cy={f(Math.sin(a) * r)} r={pr} />; });
  return (
    <>
      {(['o', 'y', 'r'] as const).map(c => {
        const [hi, mid, lo] = c === 'o' ? ['#FFC266', '#FF8A12', '#B84A00'] : c === 'y' ? ['#FFF0A0', '#FFC21A', '#C27A00'] : ['#FF8A6A', '#D8321E', '#7A1208'];
        return (
          <radialGradient key={c} id={`${id}${c}`} cx=".4" cy=".35" r=".75">
            <stop offset="0" stopColor={hi} /><stop offset=".5" stopColor={mid} /><stop offset="1" stopColor={lo} />
          </radialGradient>
        );
      })}
      <filter id={`${id}ruf`} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {(['o', 'y', 'r'] as const).map(c => (
        <symbol key={c} id={`${id}m${c}`} viewBox="-11 -11 22 22" overflow="visible">
          <g fill={`url(#${id}${c})`}>{petals(14, 7.6, 2.9)}<circle r="8" /></g>
          <g fill="#000" opacity=".12">{petals(9, 4.2, 1.8)}</g>
          <g fill={`url(#${id}${c})`} opacity=".9">{petals(9, 3.6, 1.9)}</g>
        </symbol>
      ))}
      <linearGradient id={`${id}leaf`} x1="0" x2="1">
        <stop offset="0" stopColor="#1E5A23" /><stop offset=".5" stopColor="#3E8E3A" /><stop offset="1" stopColor="#1A4A1E" />
      </linearGradient>
      <symbol id={`${id}lf`} viewBox="-8 0 16 44" overflow="visible">
        <path d="M0 0 C7 8 8 22 0 44 C-8 22 -7 8 0 0Z" fill={`url(#${id}leaf)`} />
        <path d="M0 2 V40" stroke="#9CCB7A" strokeOpacity=".55" strokeWidth=".8" />
      </symbol>
    </>
  );
}
type Bloom = { x: number; y: number; r: number; c: 'o' | 'y' | 'r'; rot: number };
const Blooms = ({ id, list }: { id: string; list: Bloom[] }) => (
  <>{list.map((b, k) => <use key={k} href={`#${id}m${b.c}`} x={f(b.x - b.r)} y={f(b.y - b.r)} width={f(b.r * 2)} height={f(b.r * 2)} transform={`rotate(${f(b.rot)} ${f(b.x)} ${f(b.y)})`} />)}</>
);

/** Toran: a rope of mango leaves, marigold swags and hanging strings of marigolds ending in a leaf. */
function Toran() {
  const id = useId().replace(/:/g, '');
  const r = rng(11), W = 1200, anchors = [0, 200, 400, 600, 800, 1000, 1200];
  const swags: Bloom[] = [], strings: { x: number; blooms: Bloom[]; len: number; dur: number }[] = [];
  anchors.slice(0, -1).forEach((a, k) => {
    const b = anchors[k + 1];
    for (let i = 0; i <= 20; i++) { const p = hang(a, 14, b, 14, 46, i / 20); swags.push({ x: p.x, y: p.y, r: 8.8 + r() * 1.6, c: i % 3 === 1 ? 'y' : 'o', rot: r() * 360 }); }
  });
  anchors.forEach((x, k) => {
    const n = 6 + Math.round(r() * 4) + (k % 2 ? 0 : 2), blooms: Bloom[] = [];
    for (let i = 0; i < n; i++) blooms.push({ x, y: 22 + i * 15, r: 8.4 + r() * 1.3, c: i % 4 === 3 ? 'r' : i % 2 ? 'y' : 'o', rot: r() * 360 });
    strings.push({ x, blooms, len: 22 + n * 15, dur: 4 + r() * 2.5 });
  });
  const leaves = Array.from({ length: 48 }, (_, k) => ({ x: 6 + k * (W - 12) / 47, rot: (r() - .5) * 18, s: .85 + r() * .3 }));
  return (
    <svg viewBox="0 -8 1200 230" className={s.svg} style={{ overflow: 'visible' }}>
      <defs><MarigoldDefs id={id} /></defs>
      <path d="M-40 6 H1240" stroke="#7A5A2A" strokeWidth="3" />
      <g>{leaves.map((l, k) => <use key={k} href={`#${id}lf`} x={f(l.x - 8 * l.s)} y="5" width={f(16 * l.s)} height={f(44 * l.s)} transform={`rotate(${f(l.rot)} ${f(l.x)} 6)`} />)}</g>
      <g filter={`url(#${id}ruf)`}>
        <Blooms id={id} list={swags} />
        {strings.map((st, k) => (
          <g key={k} className={s.dangle} style={{ ...delay(k * .8), animationDuration: `${f(st.dur)}s`, transformOrigin: `${st.x}px 10px` }}>
            <path d={`M${st.x} 10 V${st.len}`} stroke="#6B4A1E" strokeWidth="1.2" />
            <Blooms id={id} list={st.blooms} />
            <use href={`#${id}lf`} x={st.x - 6} y={st.len + 2} width="12" height="30" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** A single marigold swag. */
function Garland() {
  const id = useId().replace(/:/g, '');
  const r = rng(5), list: Bloom[] = [];
  for (let i = 0; i <= 44; i++) { const p = hang(14, 18, 886, 18, 140, i / 44); list.push({ x: p.x, y: p.y, r: 13 + r() * 2.4, c: i % 3 === 1 ? 'y' : 'o', rot: r() * 360 }); }
  return (
    <svg viewBox="0 0 900 220" className={s.svg} style={{ overflow: 'visible' }}>
      <defs><MarigoldDefs id={id} /></defs>
      <g filter={`url(#${id}ruf)`}>
        <Blooms id={id} list={list} />
        {[14, 886].map(x => <g key={x}><Blooms id={id} list={[0, 1, 2].map(i => ({ x, y: 40 + i * 24, r: 12, c: i === 2 ? 'r' : 'o', rot: i * 70 }))} /><use href={`#${id}lf`} x={x - 7} y="104" width="14" height="36" /></g>)}
      </g>
    </svg>
  );
}

function Marigold() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="-12 -12 24 24" className={s.svg}>
      <defs><MarigoldDefs id={id} /></defs>
      <g filter={`url(#${id}ruf)`}><use href={`#${id}mo`} x="-11" y="-11" width="22" height="22" /></g>
    </svg>
  );
}

/* ───────────── Rice lights: a dark wire in swags with warm bulbs that chase gently ───────────── */
function Lights() {
  const id = useId().replace(/:/g, '');
  const swags = [[0, 400], [400, 800], [800, 1200]] as const;
  const bulbs: { x: number; y: number; k: number }[] = [];
  let k = 0;
  swags.forEach(([a, b]) => { for (let i = 1; i < 13; i++) { const p = hang(a, 4, b, 4, 74, i / 13); bulbs.push({ x: p.x, y: p.y, k: k++ }); } });
  const drops = [0, 400, 800, 1200].map((x, j) => ({ x, n: 3 + (j % 2) * 2 }));
  drops.forEach(d => { for (let i = 1; i <= d.n; i++) bulbs.push({ x: d.x, y: 4 + i * 22, k: k++ }); });
  return (
    <svg viewBox="0 0 1200 140" className={s.svg} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}g`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#FFE3A0" stopOpacity=".95" /><stop offset=".35" stopColor="#FFB547" stopOpacity=".35" /><stop offset="1" stopColor="#FF9A1F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}b`} cx=".45" cy=".35" r=".7">
          <stop offset="0" stopColor="#FFFDF0" /><stop offset=".4" stopColor="#FFD780" /><stop offset=".8" stopColor="#F29A10" /><stop offset="1" stopColor="#C25E00" />
        </radialGradient>
      </defs>
      {/* the wire runs on up past the top edge, so the card's edge is where it seems to be hung from */}
      <g stroke="#2B2118" strokeWidth="2" fill="none">
        {swags.map(([a, b]) => <path key={a} d={hangPath(a, 4, b, 4, 74)} />)}
        {drops.map(d => <path key={d.x} d={`M${d.x} -300 V${4 + d.n * 22}`} />)}
      </g>
      {bulbs.map(b => (
        <g key={b.k} className={s.bulb} style={delay(b.k * .17)}>
          <circle cx={f(b.x)} cy={f(b.y + 8)} r="17" fill={`url(#${id}g)`} />
          <rect x={f(b.x - 2.2)} y={f(b.y)} width="4.4" height="4" rx=".8" fill="#3A2C1E" />
          <path d={`M${f(b.x)} ${f(b.y + 3.5)} c4.6 0 5 4.2 4.2 7.4 c-.8 3 -2.6 5 -4.2 5.6 c-1.6 -.6 -3.4 -2.6 -4.2 -5.6 c-.8 -3.2 -.4 -7.4 4.2 -7.4z`} fill={`url(#${id}b)`} />
          <ellipse cx={f(b.x - 1.4)} cy={f(b.y + 8)} rx=".9" ry="2" fill="#fff" opacity=".8" />
        </g>
      ))}
    </svg>
  );
}

/* ───────────── Rangoli: coloured powder with chalk-white dotted outlines ───────────── */
function RangoliArt({ id }: { id: string }) {
  const C = 200;
  const ring = (n: number, fn: (a: number, k: number) => ReactNode) => Array.from({ length: n }, (_, k) => fn(k * 360 / n, k));
  const petal = (r0: number, r1: number, w: number) => `M${C} ${C - r0} C${C + w} ${C - r0 - (r1 - r0) * .3} ${C + w * .7} ${C - r1 + (r1 - r0) * .25} ${C} ${C - r1} C${C - w * .7} ${C - r1 + (r1 - r0) * .25} ${C - w} ${C - r0 - (r1 - r0) * .3} ${C} ${C - r0}Z`;
  const dotted = { fill: 'none', stroke: '#FFF8EC', strokeWidth: 3.4, strokeLinecap: 'round' as const, strokeDasharray: '0 7.5' };
  return (
    <>
      <defs>
        <filter id={`${id}pw`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -.7" result="m" />
          <feComposite in="d" in2="m" operator="in" result="g" />
          <feColorMatrix in="n" type="matrix" values=".35 0 0 0 .7  .35 0 0 0 .7  .35 0 0 0 .7  0 0 0 0 1" result="sh" />
          <feBlend in="g" in2="sh" mode="multiply" result="b" />
          <feComposite in="b" in2="g" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}pw)`}>
        {ring(32, (a, k) => <circle key={k} cx={C} cy={C - 190} r="4.4" fill={k % 2 ? '#FFC21A' : '#FFF8EC'} transform={`rotate(${a} ${C} ${C})`} />)}
        {ring(16, (a, k) => <g key={k} transform={`rotate(${a + 11.25} ${C} ${C})`}>
          <path d={petal(128, 182, 30)} fill={k % 2 ? '#C2185B' : '#7B1FA2'} />
          <path d={petal(138, 170, 15)} fill="#FF9800" />
          <path d={petal(128, 182, 30)} {...dotted} />
        </g>)}
        <circle cx={C} cy={C} r="126" fill="#1565C0" />
        <circle cx={C} cy={C} r="112" fill="#FFF3D6" />
        {ring(8, (a, k) => <path key={k} d={petal(34, 110, 34)} fill="#2E7D32" transform={`rotate(${a + 22.5} ${C} ${C})`} />)}
        {ring(8, (a, k) => <g key={k} transform={`rotate(${a} ${C} ${C})`}>
          <path d={petal(34, 112, 40)} fill="#FF6F00" />
          <path d={petal(44, 96, 24)} fill="#FFC21A" />
          <path d={petal(56, 82, 9)} fill="#E53935" />
        </g>)}
        <circle cx={C} cy={C} r="40" fill="#C2185B" />
        <circle cx={C} cy={C} r="24" fill="#FFC21A" />
        <circle cx={C} cy={C} r="10" fill="#FFF8EC" />
      </g>
      <g opacity=".95">
        <circle cx={C} cy={C} r="119" {...dotted} />
        <circle cx={C} cy={C} r="134" {...dotted} />
        <circle cx={C} cy={C} r="32" {...dotted} />
        {ring(8, (a, k) => <path key={k} d={petal(34, 112, 40)} {...dotted} transform={`rotate(${a} ${C} ${C})`} />)}
      </g>
    </>
  );
}
function Rangoli() {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 400 400" className={s.svg}><RangoliArt id={id} /></svg>;
}
/** The same rangoli lying on the floor, seen from just above: for placing products and diyas "on the floor". */
function RangoliFloor() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 400 170" className={s.svg} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}l`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFB45C" stopOpacity=".35" /><stop offset="1" stopColor="#FFB45C" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse className={s.glow} style={delay(.6)} cx="200" cy="85" rx="230" ry="100" fill={`url(#${id}l)`} />
      <g transform="translate(0 0) scale(1 .425)"><RangoliArt id={id} /></g>
    </svg>
  );
}

/* ───────────── Glints: warm bokeh and a few fine four-point stars ───────────── */
function Sparkles() {
  const id = useId().replace(/:/g, '');
  const r = rng(3);
  const bokeh = Array.from({ length: 9 }, () => ({ x: 10 + r() * 100, y: 10 + r() * 80, r: 2 + r() * 6, d: r() * 4 }));
  const star = (x: number, y: number, sz: number) => `M${x} ${y - sz} Q${x + sz * .12} ${y - sz * .12} ${x + sz} ${y} Q${x + sz * .12} ${y + sz * .12} ${x} ${y + sz} Q${x - sz * .12} ${y + sz * .12} ${x - sz} ${y} Q${x - sz * .12} ${y - sz * .12} ${x} ${y - sz}Z`;
  return (
    <svg viewBox="0 0 120 100" className={s.svg} style={{ overflow: 'visible' }}>
      <defs><radialGradient id={`${id}k`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFF4CF" stopOpacity=".9" /><stop offset=".5" stopColor="#FFD27A" stopOpacity=".35" /><stop offset="1" stopColor="#FFC24A" stopOpacity="0" /></radialGradient></defs>
      {bokeh.map((b, k) => <circle key={k} className={s.bulb} style={{ ...delay(b.d), animationDuration: `${f(3 + b.d)}s` }} cx={f(b.x)} cy={f(b.y)} r={f(b.r)} fill={`url(#${id}k)`} />)}
      {[[36, 34, 13], [84, 62, 9], [96, 22, 6]].map(([x, y, sz], k) => (
        <path key={k} className={s.glint} style={delay(k * 1.1)} d={star(x, y, sz)} fill="#FFF6DA" />
      ))}
    </svg>
  );
}

/* ───────────── Firework: a gold peony burst that blooms, falls and fades, on a loop ───────────── */
function Firework() {
  const rays = Array.from({ length: 28 }, (_, k) => k * 360 / 28);
  return (
    <svg viewBox="0 0 200 200" className={s.svg} style={{ overflow: 'visible' }}>
      {[0, 1].map(b => (
        <g key={b} className={s.burst} style={{ ...delay(b * 1.6), transformOrigin: '100px 100px', transformBox: 'view-box' }}>
          {rays.map((a, k) => (
            <g key={k} transform={`rotate(${a + b * 6} 100 100)`}>
              <path d="M100 82 V18" stroke={b ? '#FFB1D8' : '#FFD98A'} strokeWidth={k % 2 ? 1.2 : 1.8} strokeLinecap="round" />
              <circle cx="100" cy={k % 2 ? 22 : 14} r="2" fill="#FFF4D6" className={s.tip} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

const ART: Record<string, { el: () => ReactNode; ratio: number; self?: boolean }> = {
  diya: { el: Diya, ratio: 200 / 150 },
  lantern: { el: Lantern, ratio: 120 / 270 },
  toran: { el: Toran, ratio: 1200 / 230, self: true },
  garland: { el: Garland, ratio: 900 / 220 },
  marigold: { el: Marigold, ratio: 1 },
  lights: { el: Lights, ratio: 1200 / 140, self: true },
  rangoli: { el: Rangoli, ratio: 1 },
  'rangoli-floor': { el: RangoliFloor, ratio: 400 / 170, self: true },
  sparkles: { el: Sparkles, ratio: 1.2, self: true },
  firework: { el: Firework, ratio: 1, self: true },
};
const keyOf = (src: string) => /^\/decor\/diwali\/([a-z-]+)\.(png|svg)$/.exec(src)?.[1];
export const hasArt = (src: string) => { const k = keyOf(src); return !!k && k in ART; };
/** true when the drawing animates itself, so the slide's generic float/sway loop should be left off */
export const selfAnimated = (src: string) => !!ART[keyOf(src) ?? '']?.self;

/** A decoration by source: the drawn art for the built-in pack, otherwise the uploaded image. */
export function DecorVisual({ src, className = '' }: { src: string; className?: string }) {
  const a = ART[keyOf(src) ?? ''];
  // eslint-disable-next-line @next/next/no-img-element -- decorations may be any uploaded PNG
  if (!a) return <img src={src} alt="" draggable={false} className={className} decoding="async" style={{ display: 'block', width: '100%', height: 'auto' }} />;
  const El = a.el;
  return <div className={`${s.art} ${className}`} style={{ aspectRatio: a.ratio }}><El /></div>;
}
