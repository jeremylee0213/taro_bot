'use client';

interface AchievementTrackerProps {
  totalSchedules: number;
  completedCount: number;
}

export function AchievementTracker({
  totalSchedules,
  completedCount,
}: AchievementTrackerProps) {
  const pct = totalSchedules > 0 ? Math.round((completedCount / totalSchedules) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4 fade-in">
      <h3 className="text-sm font-semibold text-text-primary mb-2">📊 이번 주 성취</h3>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-success h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
          {completedCount}/{totalSchedules} 완료
        </span>
      </div>
    </div>
  );
}
