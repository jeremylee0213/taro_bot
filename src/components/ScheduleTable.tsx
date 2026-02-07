'use client';

import { useCallback, useRef } from 'react';
import { TimelineEntry, ScheduleTip, BriefingEntry } from '@/types/schedule';

interface ScheduleTableProps {
  timeline: TimelineEntry[];
  scheduleTips: ScheduleTip[];
  briefings?: BriefingEntry[];
}

const PRIORITY_BADGE: Record<string, { color: string; emoji: string; label: string; ariaLabel: string }> = {
  high: { color: 'var(--color-priority-high)', emoji: '🔴', label: '높음', ariaLabel: '높은 중요도' },
  medium: { color: 'var(--color-priority-medium)', emoji: '🔵', label: '보통', ariaLabel: '보통 중요도' },
  low: { color: 'var(--color-priority-low)', emoji: '⚪', label: '낮음', ariaLabel: '낮은 중요도' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  work: '💼',
  family: '🏠',
  personal: '🧘',
  health: '🏃',
};

async function copyItemAsImage(el: HTMLElement) {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } catch {
        // fallback: download
        const link = document.createElement('a');
        link.download = 'schedule-item.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }, 'image/png');
  } catch {
    // silent fail
  }
}

async function downloadItemAsImage(el: HTMLElement, name: string) {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch {
    // silent fail
  }
}

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
        📅 오늘의 일정 + 조언
      </h3>

      <div className="space-y-3" role="list">
        {timeline.map((entry, idx) => (
          <ScheduleRow
            key={entry.id}
            entry={entry}
            index={idx + 1}
            tips={tipsMap.get(entry.id)}
            briefing={briefingMap.get(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ScheduleRow({
  entry,
  index,
  tips,
  briefing,
}: {
  entry: TimelineEntry;
  index: number;
  tips?: string[];
  briefing?: BriefingEntry;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const badge = PRIORITY_BADGE[entry.priority] || PRIORITY_BADGE.medium;

  const handleCopyImage = useCallback(() => {
    if (rowRef.current) copyItemAsImage(rowRef.current);
  }, []);

  const handleDownloadImage = useCallback(() => {
    if (rowRef.current) downloadItemAsImage(rowRef.current, `schedule-${index}`);
  }, [index]);

  return (
    <div
      ref={rowRef}
      className="rounded-xl p-4 transition-all"
      style={{
        background: 'var(--color-surface)',
        borderLeft: `4px solid ${badge.color}`,
      }}
      role="listitem"
      aria-label={`${index}번 일정: ${entry.title}, ${entry.start}~${entry.end}, ${badge.ariaLabel}`}
    >
      {/* Row 1: Number + Time + Title + Buttons */}
      <div className="flex items-start gap-2">
        {/* Number badge */}
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white mt-0.5"
          style={{ background: badge.color }}
          aria-hidden="true"
        >
          {index}
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

          {/* Title */}
          <p className="text-[17px] sm:text-[18px] font-bold mt-1" style={{ color: 'var(--color-text)' }}>
            {entry.title}
          </p>

          {/* Tips */}
          {tips && tips.length > 0 && (
            <div className="mt-2 space-y-1">
              {tips.map((tip, i) => (
                <p key={i} className="text-[14px] sm:text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  💡 {tip}
                </p>
              ))}
            </div>
          )}

          {/* Briefing */}
          {briefing && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--color-border)' }}>
              {briefing.tip && (
                <p className="text-[14px] sm:text-[15px] font-medium" style={{ color: 'var(--color-accent)' }}>
                  📋 {briefing.tip}
                </p>
              )}
              {briefing.prep.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {briefing.prep.map((p, i) => (
                    <p key={i} className="text-[13px] sm:text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                      ✅ {p}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Copy + Download buttons — 44px touch targets */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={handleCopyImage}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[16px] transition-all hover:scale-110 focus-ring"
            style={{ background: 'var(--color-accent-light)' }}
            aria-label={`${entry.title} 클립보드 이미지 복사`}
          >
            📋
          </button>
          <button
            onClick={handleDownloadImage}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[16px] transition-all hover:scale-110 focus-ring"
            style={{ background: 'var(--color-accent-light)' }}
            aria-label={`${entry.title} 이미지 저장`}
          >
            📸
          </button>
        </div>
      </div>
    </div>
  );
}
