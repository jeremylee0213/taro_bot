'use client';

import { useState } from 'react';

interface FeedbackButtonsProps {
  onFeedback: (feedback: string) => void;
}

export function FeedbackButtons({ onFeedback }: FeedbackButtonsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [retrospective, setRetrospective] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (value: string) => {
    setSelected(value);
    onFeedback(value);
  };

  const handleSubmitRetro = () => {
    if (retrospective.trim()) {
      onFeedback(`${selected} | ${retrospective.trim()}`);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-2">
        <p className="text-xs text-accent-gold">감사합니다! 내일의 카드에 반영됩니다. ✨</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <p className="text-xs text-text-muted text-center">
        📊 오늘의 카드가 와닿으셨나요?
      </p>

      <div className="flex justify-center gap-3">
        {[
          { value: 'positive', label: '✅ 공감돼요' },
          { value: 'neutral', label: '🔄 보통이에요' },
          { value: 'unknown', label: '❓ 잘 모르겠어요' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            className={`text-xs px-3 py-2 rounded-lg transition-colors ${
              selected === value
                ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/50'
                : 'bg-card text-text-muted hover:text-text-primary hover:bg-card/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selected && !submitted && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted text-center">
            💬 하루를 마치고 한 줄 회고를 남겨주세요 (선택)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={retrospective}
              onChange={(e) => setRetrospective(e.target.value)}
              placeholder="예: 투자자 미팅 잘 됐어"
              className="flex-1 text-sm bg-card rounded-lg px-3 py-2 text-text-primary placeholder-text-muted border border-transparent focus:border-accent-gold/50 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitRetro()}
            />
            <button
              onClick={handleSubmitRetro}
              className="text-xs px-3 py-2 bg-accent-gold/20 text-accent-gold rounded-lg hover:bg-accent-gold/30"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
