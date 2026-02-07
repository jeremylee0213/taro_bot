'use client';

import { TarotCard } from '@/types/tarot';

interface CardDisplayProps {
  card: TarotCard;
  oneLiner: string;
  keywords: string[];
}

export function CardDisplay({ card, oneLiner, keywords }: CardDisplayProps) {
  return (
    <div className="bg-card rounded-xl p-5 gold-border space-y-3">
      {/* Emoji Art */}
      <div className="text-center">
        <div className="text-4xl float-animation mb-2">{card.emoji_art}</div>
      </div>

      {/* Card Name */}
      <h2 className="text-center text-xl font-bold text-accent-gold">
        {card.name_kr} ({card.name_en})
        {card.reversed && (
          <span className="ml-2 text-sm text-red-400 font-normal">역방향</span>
        )}
      </h2>

      {/* Core Keywords */}
      <p className="text-center text-sm text-text-muted italic">
        &quot;{card.core_keywords.join(', ')}&quot;
      </p>

      {/* One Liner */}
      <div className="bg-surface rounded-lg px-4 py-3 border-l-2 border-accent-gold">
        <p className="text-sm">
          <span className="mr-1">💡</span>
          <strong>오늘의 한줄:</strong> {oneLiner}
        </p>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-2 justify-center">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-full bg-accent-purple/20 text-accent-purple"
          >
            #{kw}
          </span>
        ))}
      </div>
    </div>
  );
}
