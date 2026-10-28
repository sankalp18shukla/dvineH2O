import type { ReactNode } from 'react';
import { Lockup } from './Brand';

/**
 * Section heading, as the home sections: pinned lockup headline, with the lede beside it on wide screens
 * (or under it when `align` is center). `title` is written with its *italic* phrase.
 */
export function SectionHead({ tone = 'volt', title, body, align = 'left', size = 'md', children, id }: { tone?: Parameters<typeof Lockup>[0]['tone']; title: string; body?: ReactNode; align?: 'left' | 'center'; size?: 'lg' | 'md' | 'sm'; children?: ReactNode; id?: string }) {
  if (align === 'center') return (
    <div className="mb-12 flex flex-col items-center gap-8 text-center sm:mb-16" data-reveal>
      <Lockup id={id} title={title} tone={tone} size={size} className="is-center" />
      {body && <p className="lede mx-auto max-w-[42rem]">{body}</p>}
      {children}
    </div>
  );
  return (
    <div className="mb-12 sm:mb-16" data-reveal>
      <div className={`grid gap-8 ${body ? 'lg:grid-cols-[auto_1fr] lg:items-end lg:gap-16' : ''}`}>
        <Lockup id={id} title={title} tone={tone} size={size} />
        {body && <p className="lede max-w-md lg:justify-self-end">{body}</p>}
      </div>
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
