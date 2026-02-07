'use client';

import { CardDeepReading } from '@/types/tarot';

interface DeepReadingSectionProps {
  reading: CardDeepReading;
}

export function DeepReadingSection({ reading }: DeepReadingSectionProps) {
  return (
    <div className="bg-card rounded-xl p-4 pixel-border space-y-3">
      <h3 className="text-sm font-bold text-accent-gold">🔮 카드 심화 해석</h3>

      <div className="space-y-2">
        <div className="bg-surface rounded-lg p-3">
          <p className="text-xs font-bold text-green-400 mb-1">정방향</p>
          <p className="text-sm text-text-primary">{reading.upright}</p>
        </div>

        <div className="bg-surface rounded-lg p-3">
          <p className="text-xs font-bold text-red-400 mb-1">역방향</p>
          <p className="text-sm text-text-primary">{reading.reversed}</p>
        </div>

        <div className="bg-surface rounded-lg p-3 border-l-2 border-accent-gold">
          <p className="text-xs font-bold text-accent-gold mb-1">오늘의 맥락</p>
          <p className="text-sm text-text-primary">{reading.contextual}</p>
        </div>
      </div>
    </div>
  );
}
