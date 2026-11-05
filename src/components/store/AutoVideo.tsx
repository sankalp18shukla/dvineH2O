'use client';
import { useEffect, useRef } from 'react';

/** Muted looping video that plays only while on screen (and never with reduced motion). */
export function AutoVideo({ src, poster, className = '', label }: { src: string; poster?: string; className?: string; label?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current!;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: .15 });
    io.observe(v); return () => io.disconnect();
  }, []);
  return <video ref={ref} className={className} src={src} poster={poster || undefined} muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} aria-label={label} aria-hidden={!label || undefined} />;
}
