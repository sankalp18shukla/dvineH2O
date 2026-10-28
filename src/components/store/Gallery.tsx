'use client';
import Image from 'next/image';
import { useState } from 'react';

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return null;
  return (
    <div>
      <div className="pin-frame relative aspect-[4/3] bg-stage">
        <Image src={images[i]} alt={`${alt}, image ${i + 1} of ${images.length}`} fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3" role="group" aria-label="Product images">
          {images.map((src, k) => (
            <button key={src} onClick={() => setI(k)} aria-label={`Show image ${k + 1}`} aria-pressed={k === i} className={`relative aspect-square w-20 overflow-hidden rounded-xl border-2 transition ${k === i ? 'border-deep-current' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
