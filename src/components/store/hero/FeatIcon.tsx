import type { CSSProperties, ReactNode } from 'react';
import s from './Hero.module.css';

/**
 * The hero's feature icons: same drawings as ui/Icon, split into parts so each can animate in after its
 * feature falls into place (battery fills bar by bar, bubbles rise, plates stack in, the drop falls...)
 * and then keep a quiet loop going (battery charges, bubbles float, current runs across the plates...).
 * Each part gets an entrance class and an order (--o); `L` wraps a part in a looping group whose phase is --l.
 */
const m = (kind: 'pop' | 'rise' | 'grow' | 'draw' | 'fall' | 'spin' | 'graph', o = 0) =>
  ({ className: s[kind], style: { ['--o' as string]: o } as CSSProperties, pathLength: kind === 'draw' || kind === 'graph' ? 1 : undefined });

const L = (loop: 'charge' | 'float' | 'stream' | 'current' | 'turn' | 'beat' | 'bob', l: number, child: ReactNode) =>
  <g className={s[loop]} style={{ ['--l' as string]: l } as CSSProperties}>{child}</g>;

const plates = (xs: number[]) => xs.map((x, k) => <g key={x}>{L('current', k / xs.length, <path d={`M${x} 8v8`} {...m('grow', 1 + k * (5 / xs.length))} />)}</g>);

const ICONS: Record<string, ReactNode> = {
  battery: <><rect x="3" y="8" width="16" height="9" rx="2" /><path d="M19 11h2v3h-2" />
    {[6.5, 9.5, 12.5].map((x, k) => <g key={x}>{L('charge', k, <path d={`M${x} 11v3`} {...m('pop', 1 + k * 1.6)} />)}</g>)}</>,
  bubbles: <>{[[12, 16, 4.5], [7, 7.5, 2.5], [16, 6, 1.6], [19, 12, 1]].map(([cx, cy, r], k) =>
    <g key={k}>{L('float', k, <circle cx={cx} cy={cy} r={r} {...m('rise', [0, 1.2, 2.2, 3][k])} />)}</g>)}</>,
  chamber: <><ellipse cx="12" cy="5" rx="5.5" ry="2" /><path d="M6.5 5v14c0 1 2.5 2 5.5 2s5.5-1 5.5-2V5" {...m('draw', 0)} />
    {[[10, 15, 1.5], [12, 12.5, 2], [14, 16, 1.5]].map(([x, y, h], k) =>
      <g key={k}>{L('stream', k, <path d={`M${x} ${y}v-${h}`} {...m('rise', 2 + k)} />)}</g>)}</>,
  plates5: <><rect x="3" y="4" width="18" height="16" rx="3" />{plates([7, 9.5, 12, 14.5, 17])}</>,
  plates11: <><rect x="2" y="4" width="20" height="16" rx="3" />{plates([5, 6.6, 8.2, 9.8, 11.4, 13, 14.6, 16.2, 17.8, 19.4])}</>,
  modes: <>{L('turn', 0, <circle cx="12" cy="12" r="8" strokeDasharray="2 2.6" {...m('spin', 0)} />)}
    {[[12, 4], [20, 12], [12, 20], [4, 12]].map(([cx, cy], k) => <g key={k}>{L('beat', k, <circle cx={cx} cy={cy} r="1.6" {...m('pop', 1.5 + k * 1.3)} />)}</g>)}</>,
  screen: <><rect x="3" y="6" width="18" height="11" rx="2" />{L('beat', 0, <circle cx="12" cy="11.5" r="2" {...m('pop', 1.5)} />)}<path d="M8 20h8" {...m('draw', 0.5)} /></>,
  drop: L('bob', 0, <><g {...m('fall', 0)}><path d="M12 3c4.5 5.5 7 9.4 7 12.5a7 7 0 0 1-14 0C5 12.4 7.5 8.5 12 3Z" /></g><path d="M9 16a3 3 0 0 0 3 3" {...m('draw', 3)} /></>),
  display: <><rect x="3" y="5" width="18" height="11" rx="2" /><path d="M8 20h8M12 16v4" /><path d="M7 12l3-3 3 3 3-3 2 2" {...m('graph', 1)} /></>,
};

export function FeatIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" className={s.ic} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
