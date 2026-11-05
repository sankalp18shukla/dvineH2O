import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';

/** Brand accents for the pill: the product colours from the home collection, plus Ink. */
export type CtaTone = 'glacier' | 'flash' | 'volt' | 'blue' | 'white';
const ACCENT: Record<CtaTone, string> = {
  glacier: 'var(--color-glacier)', flash: 'var(--color-flash)', volt: 'var(--color-voltage)', blue: 'var(--color-clearwater)', white: '#fff',
};
export type CtaKind = 'pill' | 'ink' | 'glass';

/** Class names for the home buttons, for <button>s that render their own markup (AddToCart, SubmitButton). */
export const ctaClass = (kind: CtaKind = 'pill', extra = '') => `cta cta-${kind} ${kind === 'glass' ? 'glare' : ''} ${extra}`.trim();
export const ctaStyle = (tone: CtaTone = 'glacier') => ({ ['--accent' as string]: ACCENT[tone] }) as CSSProperties;

/** The ink arrow chip that rides across the pill on hover. */
export function CtaChip({ icon = 'arrow' }: { icon?: string }) {
  return <span className="cta-chip" aria-hidden="true"><Icon name={icon} /></span>;
}

/**
 * The home page's buttons, for any page: `pill` is the accent pill with the ink arrow chip ("Shop Crystal"),
 * `ink` the same in Ink ("Meet the Products"), `glass` the frosted pill ("Upload My Report").
 * Internal paths use next/link; hashes, tel: and mailto: are plain anchors.
 */
export function Cta({ href, children, kind = 'pill', tone = 'glacier', icon = 'arrow', className = '', id }: {
  href: string; children: ReactNode; kind?: CtaKind; tone?: CtaTone; icon?: string; className?: string; id?: string;
}) {
  const inner = <>{kind !== 'glass' && <CtaChip icon={icon} />}<span>{children}</span></>;
  const props = { id, className: ctaClass(kind, className), style: ctaStyle(tone) };
  return href.startsWith('/') ? <Link href={href} {...props}>{inner}</Link> : <a href={href} {...props}>{inner}</a>;
}

/** Copy split into words for ScrollCopy's word-by-word light-up (as the home sections). Reads as plain text. */
export function Words({ text }: { text: string }) {
  return <>{text.split(' ').map((w, i) => <span key={i} className="sw">{w} </span>)}</>;
}

/** Rising bubbles for a dark band (Hyper's hydrogen). Decorative; fixed positions so server and client agree. */
export function Bubbles({ count = 22 }: { count?: number }) {
  return (
    <div className="bubbles" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
        const size = 4 + Math.round(r(1) * 16);
        return <i key={i} style={{ left: `${(r(2) * 100).toFixed(1)}%`, width: size, height: size, ['--d' as string]: `${(7 + r(3) * 9).toFixed(1)}s`, ['--delay' as string]: `${(-r(4) * 14).toFixed(1)}s`, ['--sway' as string]: `${Math.round((r(5) - .5) * 60)}px` }} />;
      })}
    </div>
  );
}
