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
  const [elapsed, setElapsed] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Try to extract partial fields from streaming JSON
  const streamPreview = streamText ? parseStreamPreview(streamText) : null;

  return (
    <div className="space-y-5 py-6 fade-in" role="status" aria-live="polite" aria-label="분석 진행 중">
      {/* Typing indicator + Progress */}
      <div className="apple-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="typing-indicator" aria-hidden="true">
            <span /><span /><span />
          </div>
          <div className="flex-1">
            <p className="text-[16px] font-medium" style={{ color: 'var(--color-text)' }}>
              {TYPING_MESSAGES[msgIdx]}{dots}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[13px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {elapsed}s
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              ~15-30초
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div
            className="w-full rounded-full h-2.5 overflow-hidden"
            style={{ background: 'var(--color-border)' }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`분석 진행률 ${pct}%`}
          >
            <div
              className="h-2.5 rounded-full transition-all duration-700 progress-bar-animated"
              style={{ width: `${pct}%`, background: 'var(--color-accent)' }}
            />
          </div>
          <div className="flex justify-between">
            <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              {progress.label}
            </p>
            <p className="text-[13px] font-bold" style={{ color: 'var(--color-accent)' }}>
              {pct}%
            </p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mt-4">
          {['프롬프트', 'AI 분석', '결과 생성'].map((step, i) => {
            const stepNum = i + 1;
            const isDone = progress.step > stepNum;
            const isCurrent = progress.step === stepNum;
            return (
              <div key={i} className="flex items-center gap-1.5 flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                  style={{
                    background: isDone ? 'var(--color-success)' : isCurrent ? 'var(--color-accent)' : 'var(--color-border)',
                    color: isDone || isCurrent ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  {isDone ? '✓' : stepNum}
                </div>
                <span
                  className="text-[12px] font-medium hidden sm:inline"
                  style={{ color: isCurrent ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                >
                  {step}
                </span>
                {i < 2 && (
                  <div className="flex-1 h-px" style={{ background: isDone ? 'var(--color-success)' : 'var(--color-border)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stream preview — parsed preview */}
      {streamPreview && (
        <div className="apple-card p-5 fade-in">
          <p className="text-[12px] font-bold mb-3 tracking-wide" style={{ color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
            📡 실시간 생성 중
          </p>
          {streamPreview.overallTip && (
            <div className="mb-3 rounded-lg p-3" style={{ background: 'var(--color-accent-light)' }}>
              <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--color-accent)' }}>오늘의 핵심</p>
              <p className="text-[14px] font-medium" style={{ color: 'var(--color-text)' }}>
                {streamPreview.overallTip}
              </p>
            </div>
          )}
          {streamPreview.advisorNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {streamPreview.advisorNames.map((name, i) => (
                <span
                  key={i}
                  className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  💬 {name}
                </span>
              ))}
            </div>
          )}
          {!streamPreview.overallTip && streamPreview.advisorNames.length === 0 && (
            <p className="text-[13px] font-mono" style={{ color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden' }}>
              {streamText!.slice(-200)}
            </p>
          )}
        </div>
      )}

      {/* Skeleton cards */}
      {!streamText && (
        <div className="space-y-4" aria-hidden="true">
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

/** Extract partial fields from streaming JSON for preview */
function parseStreamPreview(text: string): { overallTip: string | null; advisorNames: string[] } {
  let overallTip: string | null = null;
  const advisorNames: string[] = [];

  try {
    // Try extracting overall_tip
    const tipMatch = text.match(/"overall_tip"\s*:\s*"([^"]+)"/);
    if (tipMatch) overallTip = tipMatch[1];

    // Try extracting advisor names
    const nameRegex = /"name"\s*:\s*"([^"]+)"/g;
    let nameMatch;
    while ((nameMatch = nameRegex.exec(text)) !== null) {
      if (!advisorNames.includes(nameMatch[1]) && advisorNames.length < 5) {
        advisorNames.push(nameMatch[1]);
      }
    }
  } catch {
    // ignore parse errors
  }

  return { overallTip, advisorNames };
}
