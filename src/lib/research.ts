import 'server-only';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Ref } from '@/components/ui/Cited';

/** A paper is cited only once its PDF is really in public/ (brief: a link to a placeholder is worse than no link). */
const there = (href: string) => href.startsWith('/') && existsSync(join(process.cwd(), 'public', href));

/** Drops the citations whose PDF isn't there yet; the phrase then reads as plain text. */
export const liveRefs = (refs?: Ref[]) => refs?.filter(r => there(r.href));

/** The same, for a list of items that each carry `refs`. */
export const withLiveRefs = <T extends { refs?: Ref[] }>(items: T[]) => items.map(i => ({ ...i, refs: liveRefs(i.refs) }));

/** The PDF's link once the file is in public/, otherwise null (the name then shows as plain text). */
export const docIfThere = <T extends { href: string }>(d?: T) => (d && there(d.href) ? d : null);
