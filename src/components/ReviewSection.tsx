'use client';

import { useState } from 'react';

interface ReviewSectionProps {
  review: string;
  onSave: (text: string) => void;
}

export function ReviewSection({ review, onSave }: ReviewSectionProps) {
  const [text, setText] = useState(review);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3 fade-in">
      <h3 className="text-sm font-semibold text-text-primary">📝 하루 마무리 회고</h3>
      <p className="text-xs text-text-muted">오늘 가장 잘한 일 1가지를 적어보세요</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="오늘의 회고를 적어보세요..."
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="btn-primary px-3 py-2 text-xs rounded-lg disabled:opacity-50"
        >
          {saved ? '✓' : '저장'}
        </button>
      </div>
    </div>
  );
}
