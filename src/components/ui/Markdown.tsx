/* eslint-disable @next/next/no-img-element -- post images may be on any https host (hosted links are allowed) */
import type { ReactNode } from 'react';
import { safeHref, safeSrc } from '@/lib/blog';
import s from './Markdown.module.css';

/**
 * Renders a blog post. Posts are written in a small Markdown subset and turned straight into React elements:
 * no raw HTML is ever accepted or injected, so nothing typed in the editor can run as script on the site.
 *
 *   ## Heading   ### Sub-heading   **bold**   *italic*   [link](/page or https://…)
 *   - list   1. numbered list   > quote or key point   --- (divider)
 *   ![caption](image address)   | table | rows |
 *
 * Used by the article page and by the live preview in Admin › Blog (it has no server-only imports).
 */
function inline(text: string, key = ''): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}${i++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<em key={k}>{m[2]}</em>);
    else {
      const href = safeHref(m[4]);
      out.push(href.startsWith('https://')
        ? <a key={k} href={href} target="_blank" rel="noopener noreferrer">{m[3]}</a>
        : <a key={k} href={href}>{m[3]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
const isRule = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  const take = (test: (l: string) => boolean) => { const got: string[] = []; while (i < lines.length && test(lines[i])) got.push(lines[i++]); return got; };

  while (i < lines.length) {
    const line = lines[i], k = `b${i}`;
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{2,3})\s+(.+)$/);
    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (h) { i++; blocks.push(h[1].length === 2 ? <h2 key={k}>{inline(h[2])}</h2> : <h3 key={k}>{inline(h[2])}</h3>); }
    else if (/^-{3,}\s*$/.test(line)) { i++; blocks.push(<hr key={k} />); }
    else if (img) {
      i++;
      const src = safeSrc(img[2]);
      if (src) blocks.push(<figure key={k}><img src={src} alt={img[1]} loading="lazy" decoding="async" />{img[1] && <figcaption>{img[1]}</figcaption>}</figure>);
    }
    else if (/^>\s?/.test(line)) blocks.push(<blockquote key={k}><p>{inline(take(l => /^>\s?/.test(l)).map(l => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>);
    else if (/^[-*]\s+/.test(line)) blocks.push(<ul key={k}>{take(l => /^[-*]\s+/.test(l)).map((l, n) => <li key={n}>{inline(l.replace(/^[-*]\s+/, ''))}</li>)}</ul>);
    else if (/^\d+[.)]\s+/.test(line)) blocks.push(<ol key={k}>{take(l => /^\d+[.)]\s+/.test(l)).map((l, n) => <li key={n}>{inline(l.replace(/^\d+[.)]\s+/, ''))}</li>)}</ol>);
    else if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && isRule(lines[i + 1])) {
      const head = cells(lines[i]); i += 2;
      const rows = take(l => /^\s*\|.*\|\s*$/.test(l)).map(cells);
      blocks.push(
        <div key={k} className={s.table}><table>
          <thead><tr>{head.map((c, n) => <th key={n} scope="col">{inline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((r, n) => <tr key={n}>{head.map((hd, c) => <td key={c} data-label={hd}>{inline(r[c] ?? '')}</td>)}</tr>)}</tbody>
        </table></div>);
    }
    else blocks.push(<p key={k}>{inline(take(l => !!l.trim() && !/^(#{2,3}\s|>\s?|[-*]\s+|\d+[.)]\s+|!\[|-{3,}\s*$)/.test(l) && !/^\s*\|.*\|\s*$/.test(l)).join(' ') || lines[i++])}</p>);
  }
  return <div className={`${s.post} ${className}`}>{blocks}</div>;
}
