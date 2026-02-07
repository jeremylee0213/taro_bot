'use client';

import { EnergyBlock } from '@/types/schedule';

interface EnergyChartProps {
  data: EnergyBlock[];
}

function getLevelColor(level: number): string {
  if (level >= 8) return 'var(--color-success)';
  if (level >= 6) return 'var(--color-accent)';
  if (level >= 4) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function EnergyChart({ data }: EnergyChartProps) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.hour - b.hour);
  const maxLevel = 10;

  return (
    <div className="apple-card p-5 fade-in">
      <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        ⚡ 에너지 예측
      </h3>

      <div className="flex items-end gap-1.5" style={{ height: '140px' }}>
        {sorted.map((block, idx) => {
          const heightPct = (block.level / maxLevel) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1" style={{ height: '100%' }}>
              {/* Label on top */}
              <div
                className="text-center leading-tight flex-shrink-0"
                style={{ fontSize: '10px', color: 'var(--color-text-muted)', minHeight: '24px' }}
              >
                {block.label}
              </div>
              {/* Bar */}
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: getLevelColor(block.level),
                    maxWidth: '40px',
                    minHeight: '4px',
                    opacity: 0.85,
                  }}
                />
              </div>
              {/* Level number */}
              <span
                className="font-bold flex-shrink-0"
                style={{ fontSize: '12px', color: getLevelColor(block.level) }}
              >
                {block.level}
              </span>
              {/* Hour label */}
              <span
                className="flex-shrink-0"
                style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}
              >
                {block.hour}시
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
