'use client';

import { TimelineEntry, ScheduleTip, BriefingEntry } from '@/types/schedule';

interface ScheduleTableProps {
  timeline: TimelineEntry[];
  scheduleTips: ScheduleTip[];
  briefings?: BriefingEntry[];
}

const PRIORITY_BADGE: Record<string, { color: string; emoji: string }> = {
  high: { color: 'var(--color-priority-high)', emoji: '🔴' },
  medium: { color: 'var(--color-priority-medium)', emoji: '🔵' },
  low: { color: 'var(--color-priority-low)', emoji: '⚪' },
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
    <div className="apple-card p-5 fade-in">
      <h3 className="text-[20px] font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        📅 오늘의 일정
      </h3>

      <div className="space-y-3">
        {timeline.map((entry) => {
          const tips = tipsMap.get(entry.id);
          const briefing = briefingMap.get(entry.id);
          const badge = PRIORITY_BADGE[entry.priority] || PRIORITY_BADGE.medium;

          return (
            <div
              key={entry.id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: 'var(--color-surface)',
                borderLeft: `4px solid ${badge.color}`,
              }}
            >
              {/* Header: Time + Title */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px]">
                  {CATEGORY_EMOJI[entry.category] || '📌'}
                </span>
                <span
                  className="text-[15px] font-mono font-semibold"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {entry.start}~{entry.end}
                </span>
                <span className="text-[18px] font-bold flex-1" style={{ color: 'var(--color-text)' }}>
                  {entry.title}
                </span>
                <span className="text-[14px]">{badge.emoji}</span>
              </div>

              {/* Tips - key action only */}
              {tips && tips.length > 0 && (
                <p className="text-[15px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  💡 {tips[0]}
                </p>
              )}

              {/* Briefing prep - always visible, no accordion */}
              {briefing && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--color-border)' }}>
                  {briefing.tip && (
                    <p className="text-[15px] font-medium" style={{ color: 'var(--color-accent)' }}>
                      📋 {briefing.tip}
                    </p>
                  )}
                  {briefing.prep.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {briefing.prep.map((p, i) => (
                        <p key={i} className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                          ✅ {p}
                        </p>
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
