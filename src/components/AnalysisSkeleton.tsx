'use client';

import { AnalysisProgress } from '@/types/schedule';

interface AnalysisSkeletonProps {
  progress: AnalysisProgress;
}

export function AnalysisSkeleton({ progress }: AnalysisSkeletonProps) {
  const pct = Math.round((progress.step / progress.total) * 100);

  return (
    <div className="space-y-6 py-8 fade-in">
      {/* Progress bar */}
      <div className="text-center space-y-3">
        <div className="text-2xl">🔍</div>
        <p className="text-sm font-medium text-text-primary">{progress.label}</p>
        <div className="w-full max-w-xs mx-auto bg-border rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-text-muted">{pct}%</p>
      </div>

      {/* Skeleton cards */}
      <div className="space-y-4">
        {/* Timeline skeleton */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="skeleton h-4 w-24 mb-3" />
          <div className="space-y-2">
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-8 w-5/6" />
          </div>
        </div>

        {/* Briefing skeleton */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="skeleton h-4 w-20 mb-3" />
          <div className="space-y-2">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>

        {/* Advisor skeleton */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="skeleton h-4 w-16 mb-3" />
          <div className="space-y-2">
            <div className="flex gap-3">
              <div className="skeleton h-10 w-10 rounded-full flex-shrink-0" />
              <div className="skeleton h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
