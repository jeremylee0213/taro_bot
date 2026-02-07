'use client';

import { TimelineEntry, NeuroSuggestion } from '@/types/schedule';

interface BlockCalendarProps {
  timeline: TimelineEntry[];
  neuroTips: NeuroSuggestion[];
  onClickEntry: (id: number) => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: 'var(--color-category-work)',
  family: 'var(--color-category-family)',
  personal: 'var(--color-category-personal)',
  health: 'var(--color-category-health)',
};

const PRIORITY_OPACITY: Record<string, number> = {
  high: 1,
  medium: 0.85,
  low: 0.65,
};

export function BlockCalendar({ timeline, neuroTips, onClickEntry }: BlockCalendarProps) {
  if (timeline.length === 0) return null;

  // Calculate time range
  const allStarts = timeline.map((t) => timeToMinutes(t.start));
  const allEnds = timeline.map((t) => timeToMinutes(t.end));
  const minHour = Math.floor(Math.min(...allStarts) / 60);
  const maxHour = Math.ceil(Math.max(...allEnds) / 60);

  // Generate hour slots
  const hours: number[] = [];
  for (let h = minHour; h <= maxHour; h++) hours.push(h);

  const totalMinutes = (maxHour - minHour) * 60;
  const hourHeight = 72; // px per hour
  const totalHeight = hours.length * hourHeight;

  const getTopPx = (time: string) => {
    const mins = timeToMinutes(time) - minHour * 60;
    return (mins / totalMinutes) * totalHeight;
  };

  const getHeightPx = (start: string, end: string) => {
    const dur = timeToMinutes(end) - timeToMinutes(start);
    return Math.max((dur / totalMinutes) * totalHeight, 32);
  };

  return (
    <div className="apple-card p-5 fade-in">
      <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>📅 오늘의 일정</h3>

      <div className="block-calendar" style={{ minHeight: `${totalHeight}px` }}>
        {/* Hour labels + lines */}
        {hours.map((h, idx) => (
          <div key={`label-${h}`} className="contents">
            <div className="block-hour-label" style={{ height: `${hourHeight}px`, lineHeight: `${hourHeight}px` }}>
              {String(h).padStart(2, '0')}
            </div>
            <div
              className="block-hour-line"
              style={{ height: `${hourHeight}px`, position: idx === 0 ? 'relative' : 'relative' }}
            >
              {/* Events placed in first hour-line only to avoid duplication */}
              {idx === 0 && (
                <>
                  {/* Schedule blocks */}
                  {timeline.map((entry) => (
                    <div
                      key={entry.id}
                      className="block-event"
                      onClick={() => onClickEntry(entry.id)}
                      style={{
                        top: `${getTopPx(entry.start)}px`,
                        height: `${getHeightPx(entry.start, entry.end)}px`,
                        backgroundColor: CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.work,
                        opacity: PRIORITY_OPACITY[entry.priority] || 0.85,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '13px', opacity: 0.8 }}>
                          {entry.start}~{entry.end}
                        </span>
                      </div>
                      <div className="truncate" style={{ fontSize: '15px' }}>{entry.title}</div>
                      {entry.priority === 'high' && (
                        <span style={{ fontSize: '11px', opacity: 0.7 }}>⚡ 중요</span>
                      )}
                    </div>
                  ))}

                  {/* Neuro suggestion blocks */}
                  {neuroTips.map((tip, i) => {
                    // Find the schedule this tip comes after
                    const afterEntry = timeline.find(t => t.id === tip.insert_after);
                    if (!afterEntry) return null;
                    const tipStart = afterEntry.end;
                    const tipEndMin = timeToMinutes(tipStart) + tip.duration;
                    const tipEnd = `${String(Math.floor(tipEndMin / 60)).padStart(2, '0')}:${String(tipEndMin % 60).padStart(2, '0')}`;

                    return (
                      <div
                        key={`neuro-${i}`}
                        className="block-neuro"
                        style={{
                          top: `${getTopPx(tipStart)}px`,
                          height: `${getHeightPx(tipStart, tipEnd)}px`,
                        }}
                      >
                        {tip.emoji} {tip.label} ({tip.duration}분)
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
