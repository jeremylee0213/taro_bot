'use client';

import { AdvisorComment, AdvisorTone } from '@/types/schedule';

interface AdvisorPanelProps {
  advisors: AdvisorComment[];
  tone: AdvisorTone;
  onChangeTone: (tone: AdvisorTone) => void;
  onChangeAdvisors: () => void;
}

const AVATAR_COLORS = [
  '#007aff',
  '#34c759',
  '#ff9500',
];

export function AdvisorPanel({
  advisors,
  tone,
  onChangeTone,
  onChangeAdvisors,
}: AdvisorPanelProps) {
  if (advisors.length === 0) return null;

  return (
    <div className="apple-card p-5 space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-[20px] font-bold" style={{ color: 'var(--color-text)' }}>💬 전문가 조언</h3>
        <button
          onClick={onChangeAdvisors}
          className="text-[16px] font-semibold px-3 py-1.5 rounded-xl"
          style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
        >
          🔄 변경
        </button>
      </div>

      <div className="space-y-4">
        {advisors.map((advisor, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white"
              style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
            >
              {advisor.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-bold" style={{ color: 'var(--color-text)' }}>
                {advisor.name}
              </p>
              <p className="text-[16px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                &ldquo;{advisor.comment}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tone selector */}
      <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-[15px] font-medium" style={{ color: 'var(--color-text-muted)' }}>🎯 톤</span>
        <select
          value={tone}
          onChange={(e) => onChangeTone(e.target.value as AdvisorTone)}
          className="text-[16px] px-3 py-2 rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          <option value="encouraging">🤝 격려</option>
          <option value="direct">⚡ 직설</option>
        </select>
      </div>
    </div>
  );
}
