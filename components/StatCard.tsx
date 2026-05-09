'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  caption: string;
  icon: React.ReactNode;
  /** Easing duration for count-up, ms. */
  durationMs?: number;
}

function useCountUp(target: number, durationMs: number) {
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    // Restart cleanly when target changes (e.g. async data lands).
    startedRef.current = false;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      startedRef.current = true;
      const t = Math.min(1, (now - start) / durationMs);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
      else setVal(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return val;
}

export default function StatCard({
  title,
  value,
  suffix,
  caption,
  icon,
  durationMs = 1500,
}: StatCardProps) {
  const animated = useCountUp(value, durationMs);

  return (
    <div className="stat-card-v2 bg-royal-blue border-t-4 border-gold-leaf p-8">
      {/* Animated 1px gradient border (sides + bottom; top has the 4px gold bar) */}
      <span className="stat-card-v2__shimmer" aria-hidden="true" />
      {/* Top inner highlight — light reflecting off brushed metal */}
      <span className="stat-card-v2__sheen" aria-hidden="true" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-xl text-gold-leaf flex items-center gap-2">
          <span className="stat-card-v2__pulse" aria-hidden="true" />
          {title}
        </h3>
        <span className="text-3xl stat-card-v2__icon">{icon}</span>
      </div>
      <p className="font-heading text-4xl text-white mb-2">
        {animated}
        {suffix ? <span className="text-gold-leaf ml-0.5">{suffix}</span> : null}
      </p>
      <p className="font-body text-sm text-white/70">{caption}</p>
    </div>
  );
}
