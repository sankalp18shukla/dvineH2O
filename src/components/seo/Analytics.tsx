'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Google Analytics 4 and Meta Pixel for the storefront. Nothing loads until the IDs are set
 * (NEXT_PUBLIC_GA_ID = "G-…", NEXT_PUBLIC_META_PIXEL_ID = digits); the CSP in next.config.ts opens
 * their domains only when they are. GA4 counts route changes itself (enhanced measurement); the
 * pixel is told about each one here.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

type W = Window & { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };

export function Analytics() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; } // the base snippet already counted the landing page
    (window as W).fbq?.('track', 'PageView');
  }, [path]);
  if (!GA_ID && !PIXEL_ID) return null;
  return (
    <>
      {GA_ID && <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
      </>}
      {PIXEL_ID && <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}</Script>}
    </>
  );
}

type Item = { sku: string; name: string; qty: number; unitPrice: number };

/** Reports a completed purchase once per order (amounts arrive in paise). Rendered on the thank-you screen. */
export function PurchaseEvent({ number, total, tax, coupon, items }: { number: string; total: number; tax: number; coupon: string | null; items: Item[] }) {
  useEffect(() => {
    if (!GA_ID && !PIXEL_ID) return;
    const key = `dv_purchase_${number}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* storage blocked: may report twice on reload */ }
    const w = window as W; const r = (p: number) => p / 100;
    // the analytics scripts load after hydration, so wait for them briefly
    let tries = 0;
    const send = () => {
      if ((GA_ID && !w.gtag) || (PIXEL_ID && !w.fbq)) { if (++tries < 20) setTimeout(send, 250); return; }
      w.gtag?.('event', 'purchase', { transaction_id: number, currency: 'INR', value: r(total), tax: r(tax), coupon: coupon ?? undefined,
        items: items.map(i => ({ item_id: i.sku, item_name: i.name, quantity: i.qty, price: r(i.unitPrice) })) });
      w.fbq?.('track', 'Purchase', { currency: 'INR', value: r(total), content_ids: items.map(i => i.sku), content_type: 'product', num_items: items.reduce((n, i) => n + i.qty, 0) }, { eventID: number });
    };
    send();
  }, [number, total, tax, coupon, items]);
  return null;
}
