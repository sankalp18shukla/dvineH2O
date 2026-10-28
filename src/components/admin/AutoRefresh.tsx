'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => { const t = setInterval(() => { if (!document.hidden) router.refresh(); }, seconds * 1000); return () => clearInterval(t); }, [router, seconds]);
  return <span className="flex items-center gap-1.5 font-sans text-[12px] text-muted"><span className="size-2 animate-pulse rounded-full bg-[#1B6B2C]" />Live</span>;
}
