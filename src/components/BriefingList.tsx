'use client';

import { useState } from 'react';
import { BriefingEntry } from '@/types/schedule';

interface BriefingListProps {
  briefings: BriefingEntry[];
}

function BriefingCard({ briefing, defaultOpen }: { briefing: BriefingEntry; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          {open ? '▼' : '▶'}
        </span>
        <span className="text-[16px] font-semibold flex-1" style={{ color: 'var(--color-text)' }}>
          {briefing.title}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 fade-in">
          {/* Main tip */}
          {briefing.tip && (
            <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
              💡 {briefing.tip}
            </p>
          )}
          {/* Prep items */}
          {briefing.prep.length > 0 && (
            <div className="space-y-1 pl-1">
              {briefing.prep.map((item, i) => (
                <p key={i} className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
                  • {item}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BriefingList({ briefings }: BriefingListProps) {
  if (!briefings || briefings.length === 0) return null;

  return (
    <div className="apple-card p-5 fade-in">
      <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
        📋 브리핑
      </h3>
      <div className="space-y-2">
        {briefings.map((b, idx) => (
          <BriefingCard key={b.id} briefing={b} defaultOpen={idx === 0} />
        ))}
      </div>
    </div>
  );
}
