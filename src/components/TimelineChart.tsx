'use client';

import { TimelineEntry } from '@/types/schedule';

interface TimelineChartProps {
  timeline: TimelineEntry[];
  onClickEntry: (id: number) => void;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

const CATEGORY_EMOJI: Record<string, string> = {
  work: '💼',
  family: '🏠',
  personal: '👤',
  health: '🏃',
};

export function TimelineChart({ timeline, onClickEntry }: TimelineChartProps) {
  if (timeline.length === 0) return null;

  // Find range
  const allStarts = timeline.map((t) => timeToMinutes(t.start) - t.buffer_before);
  const allEnds = timeline.map((t) => timeToMinutes(t.end) + t.buffer_after);
  const minTime = Math.min(...allStarts);
  const maxTime = Math.max(...allEnds);
  const totalRange = maxTime - minTime || 1;

  // Generate hour labels
  const startHour = Math.floor(minTime / 60);
  const endHour = Math.ceil(maxTime / 60);
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  return (
    <div className="bg-card rounded-xl border border-border p-4 fade-in">
      <h3 className="text-sm font-semibold text-text-primary mb-3">📊 타임라인</h3>

      <div className="relative" style={{ minHeight: '200px' }}>
        {/* Hour grid lines */}
        {hours.map((h) => {
          const pos = ((h * 60 - minTime) / totalRange) * 100;
          return (
            <div key={h} className="absolute left-0 right-0" style={{ top: `${pos}%` }}>
              <div className="flex items-center">
                <span className="text-[10px] text-text-muted w-10 text-right pr-2">
                  {String(h).padStart(2, '0')}:00
                </span>
                <div className="flex-1 border-t border-border/50" />
              </div>
            </div>
          );
        })}

        {/* Timeline entries */}
        <div className="ml-12 relative" style={{ minHeight: '200px' }}>
          {timeline.map((entry) => {
            const startMin = timeToMinutes(entry.start);
            const endMin = timeToMinutes(entry.end);
            const top = ((startMin - minTime) / totalRange) * 100;
            const height = ((endMin - startMin) / totalRange) * 100;

            // Buffer bars
            const bufferTopPct = entry.buffer_before > 0
              ? ((entry.buffer_before) / totalRange) * 100
              : 0;
            const bufferBotPct = entry.buffer_after > 0
              ? ((entry.buffer_after) / totalRange) * 100
              : 0;

            return (
              <div key={entry.id}>
                {/* Buffer before */}
                {entry.buffer_before > 0 && (
                  <div
                    className="absolute left-0 right-0 bg-border/30 rounded-t timeline-bar"
                    style={{
                      top: `${top - bufferTopPct}%`,
                      height: `${bufferTopPct}%`,
                      minHeight: '8px',
                    }}
                  />
                )}

                {/* Main bar */}
                <div
                  onClick={() => onClickEntry(entry.id)}
                  className={`absolute left-0 right-0 ${PRIORITY_COLORS[entry.priority]} rounded timeline-bar flex items-center px-2 overflow-hidden`}
                  style={{
                    top: `${top}%`,
                    height: `${Math.max(height, 3)}%`,
                    minHeight: '24px',
                    opacity: 0.85,
                  }}
                >
                  <span className="text-[10px] text-white font-medium truncate">
                    {entry.start} {entry.title} {CATEGORY_EMOJI[entry.category] || ''}
                  </span>
                  {entry.category === 'family' && (
                    <span className="ml-1 text-[10px]">🏠</span>
                  )}
                </div>

                {/* Buffer after */}
                {entry.buffer_after > 0 && (
                  <div
                    className="absolute left-0 right-0 bg-border/30 rounded-b timeline-bar"
                    style={{
                      top: `${top + height}%`,
                      height: `${bufferBotPct}%`,
                      minHeight: '8px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
