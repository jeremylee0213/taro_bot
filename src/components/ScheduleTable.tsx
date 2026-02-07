'use client';

import { TimelineEntry, ScheduleTip, BriefingEntry } from '@/types/schedule';

interface ScheduleTableProps {
  timeline: TimelineEntry[];
  scheduleTips: ScheduleTip[];
  briefings?: BriefingEntry[];
}

const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  high: { color: 'var(--color-priority-high)', label: '높음' },
  medium: { color: 'var(--color-priority-medium)', label: '보통' },
  low: { color: 'var(--color-priority-low)', label: '낮음' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  work: '💼',
  family: '🏠',
  personal: '👤',
  health: '🏃',
};

export function ScheduleTable({ timeline, scheduleTips, briefings }: ScheduleTableProps) {
  if (timeline.length === 0) return null;

  const tipsMap = new Map<number, string[]>();
  for (const st of scheduleTips) {
    tipsMap.set(st.schedule_id, st.tips);
  }

  const briefingMap = new Map<number, BriefingEntry>();
  if (briefings) {
    for (const b of briefings) {
      briefingMap.set(b.id, b);
    }
  }

  return (
    <div className="apple-card p-4 fade-in overflow-x-auto">
      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text)' }}>
        📅 일정 & 브리핑
      </h3>

      <div className="space-y-3">
        {timeline.map((entry) => {
          const tips = tipsMap.get(entry.id);
          const briefing = briefingMap.get(entry.id);
          const badge = PRIORITY_BADGE[entry.priority];

          return (
            <div
              key={entry.id}
              className="rounded-xl p-3 transition-all"
              style={{
                background: 'var(--color-surface)',
                borderLeft: `4px solid ${badge.color}`,
              }}
            >
              {/* Row 1: Time + Title + Category */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {entry.start}~{entry.end}
                </span>
                <span className="text-[16px] font-semibold flex-1" style={{ color: 'var(--color-text)' }}>
                  {entry.title}
                </span>
                <span className="text-[13px]">{CATEGORY_EMOJI[entry.category] || '💼'}</span>
                {entry.priority === 'high' && <span className="text-[12px]">⚡</span>}
              </div>

              {/* Row 2: Tips (from schedule_tips) */}
              {tips && tips.length > 0 && (
                <p className="text-[13px] mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  💡 {tips.join(' · ')}
                </p>
              )}

              {/* Row 3: Briefing (tip + prep) — merged inline */}
              {briefing && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--color-border)' }}>
                  {briefing.tip && (
                    <p className="text-[13px]" style={{ color: 'var(--color-accent)' }}>
                      📋 {briefing.tip}
                    </p>
                  )}
                  {briefing.prep.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {briefing.prep.map((p, i) => (
                        <span key={i} className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                          • {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
