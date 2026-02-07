'use client';

import { useCallback } from 'react';
import { AnalysisResult, ScheduleItem, EnergyLevel } from '@/types/schedule';

function makeCacheKey(schedules: ScheduleItem[], energy: EnergyLevel, advisorIds: string[]): string {
  const scheduleKey = schedules
    .map((s) => `${s.startTime}-${s.endTime}-${s.title}-${s.priority}-${s.emotion}`)
    .join('|');
  return `analysis:${scheduleKey}:${energy}:${advisorIds.sort().join(',')}`;
}

export function useAnalysisCache() {
  const getCached = useCallback(
    (schedules: ScheduleItem[], energy: EnergyLevel, advisorIds: string[]): AnalysisResult | null => {
      try {
        const key = makeCacheKey(schedules, energy, advisorIds);
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    []
  );

  const setCache = useCallback(
    (schedules: ScheduleItem[], energy: EnergyLevel, advisorIds: string[], result: AnalysisResult) => {
      try {
        const key = makeCacheKey(schedules, energy, advisorIds);
        sessionStorage.setItem(key, JSON.stringify(result));
      } catch {
        // sessionStorage full — ignore
      }
    },
    []
  );

  return { getCached, setCache };
}
