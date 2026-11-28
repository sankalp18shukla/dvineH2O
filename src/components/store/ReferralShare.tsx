'use client';
import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';

/** The referral code and the three ways to pass it on: the phone's share sheet, WhatsApp, or copy. */
export function ReferralShare({ code, link, message }: { code: string; link: string; message: string }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'), []);
  const copy = async (what: 'code' | 'link') => {
    try { await navigator.clipboard.writeText(what === 'code' ? code : link); setCopied(what); setTimeout(() => setCopied(null), 1800); } catch { /* clipboard blocked */ }
  };
  const share = async () => { try { await navigator.share({ title: 'DVINE H2O', text: message, url: link }); } catch { /* dismissed */ } };
  const wa = `https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`;
  return (
    <div className="font-sans">
      <p className="text-sm text-white/70">Your code</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => copy('code')} className="group flex items-center gap-3 rounded-2xl border border-dashed border-white/40 bg-white/10 px-5 py-3 text-left transition hover:border-white hover:bg-white/15" aria-label={`Copy code ${code}`}>
          <span className="text-2xl font-bold tracking-[0.12em] sm:text-3xl">{code}</span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-voltage"><Icon name={copied === 'code' ? 'check' : 'copy'} className="size-4" />{copied === 'code' ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-volt"><Icon name="whatsapp" className="size-4" /> Share on WhatsApp</a>
        {canShare && <button type="button" onClick={share} className="btn btn-outline"><Icon name="external" className="size-4" /> More ways to share</button>}
        <button type="button" onClick={() => copy('link')} className="btn btn-outline"><Icon name={copied === 'link' ? 'check' : 'copy'} className="size-4" /> {copied === 'link' ? 'Link copied' : 'Copy link'}</button>
      </div>
      <p className="mt-3 break-all text-[12.5px] text-white/60">{link.replace(/^https?:\/\//, '')}</p>
    </div>
  );
}
