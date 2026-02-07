'use client';

import { TimelineEntry, ScheduleTip } from '@/types/schedule';

interface BlockCalendarProps {
  timeline: TimelineEntry[];
  scheduleTips: ScheduleTip[];
  onEventClick?: (scheduleId: number) => void;
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

export function BlockCalendar({ timeline, scheduleTips, onEventClick }: BlockCalendarProps) {
  if (timeline.length === 0) return null;

  // Build tips lookup
  const tipsMap = new Map<number, string[]>();
  for (const st of scheduleTips) {
    tipsMap.set(st.schedule_id, st.tips);
  }

  // Calculate time range
  const allStarts = timeline.map((t) => timeToMinutes(t.start));
  const allEnds = timeline.map((t) => timeToMinutes(t.end));
  const minHour = Math.floor(Math.min(...allStarts) / 60);
  const maxHour = Math.ceil(Math.max(...allEnds) / 60);

  const hours: number[] = [];
  for (let h = minHour; h <= maxHour; h++) hours.push(h);

  const totalMinutes = (maxHour - minHour) * 60;
  const hourHeight = 72;
  const totalHeight = hours.length * hourHeight;

  const getTopPx = (time: string) => {
    const mins = timeToMinutes(time) - minHour * 60;
    return (mins / totalMinutes) * totalHeight;
  };

  const getHeightPx = (start: string, end: string) => {
    const dur = timeToMinutes(end) - timeToMinutes(start);
    return Math.max((dur / totalMinutes) * totalHeight, 40);
  };

  return (
    <div className="apple-card p-5 fade-in">
      <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>📅 오늘의 일정</h3>

      <div className="block-calendar" style={{ minHeight: `${totalHeight}px` }}>
        {hours.map((h, idx) => (
          <div key={`label-${h}`} className="contents">
            <div className="block-hour-label" style={{ height: `${hourHeight}px`, lineHeight: `${hourHeight}px` }}>
              {String(h).padStart(2, '0')}
            </div>
            <div className="block-hour-line" style={{ height: `${hourHeight}px`, position: 'relative' }}>
              {idx === 0 && (
                <>
                  {timeline.map((entry) => {
                    const tips = tipsMap.get(entry.id);
                    return (
                      <div
                        key={entry.id}
                        className="block-event"
                        onClick={() => onEventClick?.(entry.id)}
                        style={{
                          top: `${getTopPx(entry.start)}px`,
                          height: `${getHeightPx(entry.start, entry.end)}px`,
                          backgroundColor: CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.work,
                          opacity: entry.priority === 'high' ? 1 : entry.priority === 'medium' ? 0.85 : 0.65,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: '14px', opacity: 0.85 }}>
                            {entry.start}~{entry.end}
                          </span>
                          {entry.priority === 'high' && (
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>⚡</span>
                          )}
                        </div>
                        <div className="truncate" style={{ fontSize: '16px', fontWeight: 600 }}>{entry.title}</div>
                        {/* Inline tips */}
                        {tips && tips.length > 0 && (
                          <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                            💡 {tips.join(' · ')}
                          </div>
                        )}
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
