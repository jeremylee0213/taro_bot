'use client';

import { useState } from 'react';
import { BriefingEntry } from '@/types/schedule';

interface BriefingCardProps {
  briefing: BriefingEntry;
  defaultOpen?: boolean;
}

const CONFIDENCE_DOTS = (level: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < level ? 'text-accent' : 'text-border'}>●</span>
  ));
};

export function BriefingCard({ briefing, defaultOpen = false }: BriefingCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      id={`briefing-${briefing.id}`}
      className="bg-card border border-border rounded-xl overflow-hidden fade-in"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{isOpen ? '▼' : '▶'}</span>
          <span className="text-sm font-medium text-text-primary">{briefing.title}</span>
          {briefing.is_family && <span className="text-xs">🏠</span>}
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          {CONFIDENCE_DOTS(briefing.confidence)}
        </div>
      </button>

      {/* Accordion body */}
      <div
        className="accordion-content"
        style={{
          maxHeight: isOpen ? '600px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Before */}
          <div>
            <h4 className="text-xs font-semibold text-accent mb-1">📌 Before (준비)</h4>
            <ul className="space-y-1">
              {briefing.before.map((item, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                  <span className="text-text-muted">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* During */}
          <div>
            <h4 className="text-xs font-semibold text-warning mb-1">🎯 During (진행 중)</h4>
            <ul className="space-y-1">
              {briefing.during.map((item, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                  <span className="text-text-muted">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div>
            <h4 className="text-xs font-semibold text-success mb-1">✅ After (후속 조치)</h4>
            <ul className="space-y-1">
              {briefing.after.map((item, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                  <span className="text-text-muted">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transition */}
          {briefing.transition && (
            <div className="bg-surface rounded-lg px-3 py-2">
              <p className="text-xs text-text-secondary">
                → {briefing.transition}
              </p>
            </div>
          )}

          {/* Emotion note */}
          {briefing.emotion_note && (
            <div className="bg-info/10 border border-info/20 rounded-lg px-3 py-2">
              <p className="text-xs text-text-primary">
                💬 {briefing.emotion_note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
