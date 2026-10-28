import Image from 'next/image';
import type { ReactNode } from 'react';

/**
 * Brand-book headline lockup: text between *asterisks* is set in Garamond italic inside the
 * heavy sans headline ("*Brand* Colours", "*Typo*graphy"). Strings without asterisks pass through.
 */
export function rich(text: string): ReactNode {
  if (!text.includes('*')) return text;
  return text.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? <em key={i} className="lockup">{part.slice(1, -1)}</em> : part);
}
/** Same text without the lockup markup (for aria labels, metadata, search). */
export const plain = (text: string) => text.replace(/\*/g, '');

type Tone = 'volt' | 'glacier' | 'blue' | 'ultra' | 'flash';
/** Pinned label box: Garamond italic on a highlight block with the two corner pins. */
export function LabelBox({ children, tone = 'volt', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`label-box ${tone === 'volt' ? '' : `is-${tone}`} ${className}`}>
      <span className="pin" aria-hidden="true" /><span className="lb-txt">{children}</span><span className="pin-end" aria-hidden="true" />
    </span>
  );
}

/**
 * Brand-book headline lockup ("*Brand* Story", p. 4–16): a Garamond italic line over a heavy sans
 * line, each on its own stepped highlight block, pinned top-left and bottom-right.
 * `title` is written "*italic line* sans line".
 */
type LockTone = 'volt' | 'glacier' | 'blue' | 'flash' | 'ultra';
/**
 * `title` may also end on the italic ("Check the fit. *Know what comes with it.*"): the sans line then
 * sits on top and the italic hangs under it, overlapping its bottom edge (.is-tail).
 * `size`: lg as the home sections, md for inner-page sections with longer lines, sm for compact pages.
 */
export function Lockup({ title, tone = 'volt', as: Tag = 'h2', id, size = 'lg', className = '' }: { title: string; tone?: LockTone; as?: 'h1' | 'h2' | 'h3'; id?: string; size?: 'lg' | 'md' | 'sm'; className?: string }) {
  const lead = title.match(/^\*([^*]+)\*\s*(.*)$/);
  const tail = !lead && title.match(/^([^*]+?)\s*\*([^*]+)\*$/);
  const sz = size === 'lg' ? '' : `is-${size}`;
  if (tail) return (
    <Tag id={id} className={`lk is-tail is-${tone} ${sz} ${className}`}>
      <span className="lk-bot"><span className="lk-txt">{tail[1]}</span></span>{' '}
      <span className="lk-top"><span className="lk-ink">{tail[2]}</span></span>
    </Tag>
  );
  const [top, bottom] = lead ? [lead[1], lead[2]] : ['', plain(title)];
  return (
    <Tag id={id} className={`lk is-${tone} ${sz} ${className}`}>
      {top && <span className="lk-top"><span className="lk-ink">{top}</span></span>}{top && ' '}
      <span className="lk-bot"><span className="lk-txt">{bottom}</span></span>
    </Tag>
  );
}

/** Rule-topped fact rows (the home collection's feature row): ink rule over each item, thin dividers between. */
export function Facts({ items, cols = 3, className = '' }: { items: { title: string; body: ReactNode; icon?: ReactNode }[]; cols?: 2 | 3 | 4; className?: string }) {
  return (
    <dl className={`facts is-${cols} ${className}`}>
      {items.map(f => <div key={f.title}>{f.icon}<dt>{f.title}</dt><dd>{f.body}</dd></div>)}
    </dl>
  );
}

/** Numbered steps on Voltage chips (the home technology list). */
export function Steps({ items, className = '' }: { items: { title: string; body?: ReactNode }[]; className?: string }) {
  return (
    <ol className={`grid gap-5 ${className}`}>
      {items.map((s, i) => (
        <li key={s.title} className="flex items-start gap-4">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center bg-voltage font-sans text-sm font-bold text-ink">{String(i + 1).padStart(2, '0')}</span>
          <div><h3 className="font-sans text-lg font-semibold">{s.title}</h3>{s.body && <p className="opacity-75">{s.body}</p>}</div>
        </li>
      ))}
    </ol>
  );
}

/** "The [sticker] BRAND" band lockup (brand book p. 3): italic word, peel sticker, heavy word on a highlight band. */
export function BandLockup({ lead, tail, id, className = '' }: { lead: string; tail: string; id?: string; className?: string }) {
  return (
    <h2 id={id} className={`band-lk ${className}`}>
      <span className="band-bg" aria-hidden="true" />
      <span className="band-it">{lead}</span>{' '}
      <WaterSticker className="band-st" />
      <span className="band-sans">{tail}</span>
    </h2>
  );
}

/** Round peel sticker, "water as intended" (brand book p. 3, p. 20), from the brand artwork. */
export function WaterSticker({ className = '' }: { className?: string }) {
  return <Image src="/brand/water_as_intended.png" alt="" width={1254} height={1254} sizes="200px" className={`water-sticker ${className}`} aria-hidden="true" />;
}

/** Die-cut phrase sticker from the brand elements page ("BRB, Refilling.", "Sip Check."…). Decorative. */
export function DieCut({ text, tone = 'blue', className = '' }: { text: string; tone?: 'blue' | 'red' | 'orange'; className?: string }) {
  return <span className={`diecut is-${tone} ${className}`} data-text={text} aria-hidden="true">{text}</span>;
}

/** Piece of yellow tape (brand elements page) for pinning a photo. */
export function Tape({ className = '' }: { className?: string }) {
  return <span className={`tape ${className}`} aria-hidden="true" />;
}

/** The loose hand-drawn squiggle from the brand elements page. */
export function Squiggle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 260" fill="none" className={className} aria-hidden="true">
      <path d="M146 18c-22-14-52 6-36 26 12 15 40-4 24-18-30-26-96-10-104 34-7 40 46 50 84 34 44-18 96-30 116 6 22 40-34 62-74 50-36-11-82 0-80 34 2 30 46 36 76 22 34-16 64 4 58 34-5 24-30 34-50 28"
        stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
