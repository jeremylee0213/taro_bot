'use client';

import { AdvisorComment, AdvisorTone } from '@/types/schedule';

interface AdvisorPanelProps {
  advisors: AdvisorComment[];
  tone: AdvisorTone;
  onChangeTone: (tone: AdvisorTone) => void;
  onChangeAdvisors: () => void;
}

const INITIALS_COLORS = [
  'bg-accent text-white',
  'bg-success text-white',
  'bg-info text-white',
  'bg-warning text-white',
  'bg-danger text-white',
];

export function AdvisorPanel({
  advisors,
  tone,
  onChangeTone,
  onChangeAdvisors,
}: AdvisorPanelProps) {
  if (advisors.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3 fade-in">
      <h3 className="text-sm font-semibold text-text-primary">💬 조언자</h3>

      <div className="space-y-2">
        {advisors.map((advisor, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {/* Initials avatar */}
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                INITIALS_COLORS[idx % INITIALS_COLORS.length]
              }`}
            >
              {advisor.initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-text-primary">
                  {advisor.name}
                </span>
                <span className="text-[10px] text-text-muted">
                  → {advisor.target_schedule}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                &ldquo;{advisor.comment}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={onChangeAdvisors}
          className="text-xs text-accent hover:underline"
        >
          조언자 변경
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted">톤:</span>
          <select
            value={tone}
            onChange={(e) => onChangeTone(e.target.value as AdvisorTone)}
            className="text-xs bg-surface border border-border rounded px-2 py-1 text-text-primary"
          >
            <option value="encouraging">격려 모드</option>
            <option value="direct">직설 모드</option>
          </select>
        </div>
      </div>
    </div>
  );
}
