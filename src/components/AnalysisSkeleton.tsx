'use client';

import { useState, useEffect } from 'react';
import { AnalysisProgress } from '@/types/schedule';

interface AnalysisSkeletonProps {
  progress: AnalysisProgress;
  streamText?: string;
}

const TYPING_MESSAGES = [
  '일정을 분석하고 있습니다',
  '에너지 패턴을 파악하고 있습니다',
  '조언자의 인사이트를 준비합니다',
  '최적의 전략을 수립합니다',
];

export function AnalysisSkeleton({ progress, streamText }: AnalysisSkeletonProps) {
  const pct = Math.round((progress.step / progress.total) * 100);
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % TYPING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5 py-6 fade-in">
      {/* Typing indicator */}
      <div className="apple-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="typing-indicator">
            <span /><span /><span />
          </div>
          <p className="text-[16px] font-medium" style={{ color: 'var(--color-text)' }}>
            {TYPING_MESSAGES[msgIdx]}{dots}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full rounded-full h-2" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'var(--color-accent)' }}
            />
          </div>
          <div className="flex justify-between">
            <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              {progress.label}
            </p>
            <p className="text-[13px] font-medium" style={{ color: 'var(--color-accent)' }}>
              {pct}%
            </p>
          </div>
        </div>
      </div>

      {/* Stream preview */}
      {streamText && (
        <div className="apple-card p-5 fade-in">
          <p className="text-[14px] font-mono leading-relaxed" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'hidden' }}>
            {streamText.slice(-300)}
          </p>
        </div>
      )}

      {/* Skeleton cards */}
      {!streamText && (
        <div className="space-y-4">
          <div className="apple-card p-4">
            <div className="skeleton h-5 w-32 mb-3" />
            <div className="space-y-2">
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-4/5" />
              <div className="skeleton h-10 w-11/12" />
            </div>
          </div>

          <div className="apple-card p-4">
            <div className="skeleton h-5 w-24 mb-3" />
            <div className="flex gap-3">
              <div className="skeleton h-12 w-12 rounded-full flex-shrink-0" />
              <div className="skeleton h-12 w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
