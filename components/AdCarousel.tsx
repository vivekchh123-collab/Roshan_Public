'use client';
import { useEffect, useState } from 'react';

// Full-screen ad slider: height = screen minus navbar (3.5rem) and announcement bar (2rem).
const FULL = 'h-[calc(100dvh-5.5rem)]';

export default function AdCarousel({ images }: { images: string[] }) {
  const [i, setI] = useState(0);
  const n = images.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 4000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) {
    return (
      <div className={`${FULL} flex w-full items-center justify-center bg-gradient-to-br from-brand-blue to-brand-navy text-center text-white`}>
        <div>
          <img src="/logo.png" alt="" className="mx-auto mb-3 h-24 w-24 rounded-full bg-white object-cover" />
          <p className="text-3xl font-extrabold">Roshan Tubes</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${FULL} w-full overflow-hidden bg-slate-900`}>
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ width: `${n * 100}%`, transform: `translateX(-${(i * 100) / n}%)` }}
      >
        {images.map((src, k) => (
          <div key={k} className="relative h-full" style={{ width: `${100 / n}%` }}>
            {/* blurred copy fills the empty sides */}
            <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
            {/* the real poster, never cropped */}
            <img src={src} alt={`Advertisement ${k + 1}`} className="relative h-full w-full object-contain" />
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {images.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`Slide ${k + 1}`}
              className={`h-2.5 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-2.5 bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
