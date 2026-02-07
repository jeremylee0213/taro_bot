'use client';

interface EmptyStateProps {
  onAddSchedule: () => void;
  onApplyPreset: () => void;
}

export function EmptyState({ onAddSchedule, onApplyPreset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 fade-in">
      <div className="text-6xl mb-4">📋</div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">일정을 추가하고</h2>
      <p className="text-sm text-text-secondary mb-6">AI 브리핑을 받아보세요</p>
      <div className="flex gap-3">
        <button
          onClick={onAddSchedule}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 일정 추가
        </button>
        <button
          onClick={onApplyPreset}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-text-secondary hover:bg-surface transition-colors"
        >
          프리셋으로 시작
        </button>
      </div>
    </div>
  );
}
