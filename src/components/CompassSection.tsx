'use client';

import { Compass } from '@/types/tarot';

interface CompassSectionProps {
  compass: Compass;
}

export function CompassSection({ compass }: CompassSectionProps) {
  return (
    <div className="bg-gradient-to-r from-card to-surface rounded-xl p-4 border border-accent-purple/30">
      <h3 className="text-sm font-bold text-accent-purple mb-3">
        🧭 오늘의 나침반 (캡틴K)
      </h3>
      <blockquote className="text-sm text-text-primary leading-relaxed">
        <span className="text-text-primary">&quot;{compass.insight}</span>
        <br />
        <span className="text-accent-gold font-medium">{compass.question}&quot;</span>
      </blockquote>
    </div>
  );
}
