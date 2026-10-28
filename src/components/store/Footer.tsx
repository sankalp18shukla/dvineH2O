import Link from 'next/link';
import { FOOTER, POLICY_LINKS, SITE, SOCIAL } from '@/lib/content';
import { Logo } from '../ui/Logo';
import { FooterWaves } from './FooterWaves';

const SOCIAL_ICON: Record<(typeof SOCIAL)[number]['key'], React.ReactNode> = {
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" /></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7.5 10.5v6M7.5 7.5v.01M11.5 16.5v-6M11.5 13.2c0-1.6 1-2.7 2.5-2.7s2.5 1 2.5 2.7v3.3" /></>,
  youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor" /></>,
};

/** Site footer. Fixed behind the page (`.page-card`) so the page lifts off it; FooterReveal decides when it fits. */
export function Footer() {
  return (
    <footer id="site-footer" className="site-footer on-dark no-print overflow-hidden bg-stage-deep text-white">
      <FooterWaves className="pointer-events-none absolute inset-0 size-full" />
      <div className="container-x relative pt-14 pb-6 lg:pt-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Link href="/" aria-label="DVINE H2O home" className="inline-block"><Logo className="h-6 w-auto" /></Link>
            <p className="mt-5 font-serif text-2xl italic text-white/85">Water should do more.</p>
            <ul className="mt-7 flex gap-3" aria-label="DVINE H2O on social media">
              {SOCIAL.map(s => (
                <li key={s.key}>
                  <a href={s.href} aria-label={`DVINE H2O on ${s.label}`} className="glare grid size-11 place-items-center rounded-full bg-gradient-to-br from-white/[0.16] to-white/[0.04] text-white/85 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.5)] backdrop-blur-md transition-[background-color,color,transform] duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{SOCIAL_ICON[s.key]}</svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-9 sm:grid-cols-4 lg:gap-x-16">
            {FOOTER.map(col => (
              <div key={col.title}>
                <h2 className="font-sans text-sm font-semibold text-white">{col.title}</h2>
                <ul className="mt-4 space-y-2.5 font-sans text-sm text-white/65">
                  {col.links.map(l => <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/12 pt-5 font-sans text-[13px] text-white/55 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {POLICY_LINKS.map(l => <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>)}
          </ul>
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        </div>
        {/* oversized watermark wordmark, fading out toward the bottom edge */}
        <div className="mt-10 select-none text-white/[0.07] [mask-image:linear-gradient(to_bottom,black_45%,transparent)] lg:mt-14" aria-hidden="true">
          <Logo className="h-auto w-full" title="" />
        </div>
      </div>
    </footer>
  );
}
