'use client';

import { TimelineEntry, ScheduleTip, BriefingEntry } from '@/types/schedule';

interface ScheduleTableProps {
  timeline: TimelineEntry[];
  scheduleTips: ScheduleTip[];
  briefings?: BriefingEntry[];
}

const PRIORITY_BADGE: Record<string, { color: string; label: string; ariaLabel: string }> = {
  high: { color: 'var(--color-priority-high)', label: '높음', ariaLabel: '높은 중요도' },
  medium: { color: 'var(--color-priority-medium)', label: '보통', ariaLabel: '보통 중요도' },
  low: { color: 'var(--color-priority-low)', label: '낮음', ariaLabel: '낮은 중요도' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  work: '💼',
  family: '🏠',
  personal: '🧘',
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
    <div className="apple-card p-4 sm:p-6 fade-in" role="region" aria-label="오늘의 일정과 조언">
      <h3 className="text-[20px] sm:text-[22px] font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        📅 <span style={{ borderBottom: '3px solid var(--color-accent)', paddingBottom: '2px' }}>오늘의 일정 + 조언</span>
      </h3>

      <div className="space-y-3" role="list">
        {timeline.map((entry, idx) => {
          const badge = PRIORITY_BADGE[entry.priority] || PRIORITY_BADGE.medium;
          const tips = tipsMap.get(entry.id);
          const briefing = briefingMap.get(entry.id);

          return (
            <div
              key={entry.id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: 'var(--color-surface)',
                borderLeft: `4px solid ${badge.color}`,
              }}
              role="listitem"
              aria-label={`${idx + 1}번 일정: ${entry.title}, ${entry.start}~${entry.end}, ${badge.ariaLabel}`}
            >
              <div className="flex items-start gap-2">
                {/* Number badge */}
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white mt-0.5"
                  style={{ background: badge.color }}
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Time + Category + Priority label */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px]" aria-hidden="true">
                      {CATEGORY_EMOJI[entry.category] || '📌'}
                    </span>
                    <span
                      className="text-[14px] sm:text-[15px] font-mono font-semibold"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {entry.start}~{entry.end}
                    </span>
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: badge.color, color: '#fff' }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Title — bold + accent underline */}
                  <p className="text-[17px] sm:text-[18px] font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                    <span style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: '1px' }}>{entry.title}</span>
                  </p>

                  {/* Tips — italic style for emphasis */}
                  {tips && tips.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {tips.map((tip, i) => (
                        <p key={i} className="text-[14px] sm:text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                          💡 <em style={{ fontStyle: 'italic' }}>{tip}</em>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Briefing — color-coded */}
                  {briefing && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--color-border)' }}>
                      {briefing.tip && (
                        <p className="text-[14px] sm:text-[15px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                          📋 <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{briefing.tip}</span>
                        </p>
                      )}
                      {briefing.prep.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {briefing.prep.map((p, i) => (
                            <p key={i} className="text-[13px] sm:text-[14px]" style={{ color: 'var(--color-success)' }}>
                              ✅ {p}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
