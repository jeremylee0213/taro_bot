'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScheduleItem, EnergyLevel, DayData } from '@/types/schedule';

const STORAGE_KEY = 'ceo-planner-days';

function loadAllDays(): Record<string, DayData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllDays(days: Record<string, DayData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}

export function useScheduleStore(date: string) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [review, setReview] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data for the selected date
  useEffect(() => {
    const days = loadAllDays();
    const dayData = days[date];
    if (dayData) {
      setSchedules(dayData.schedules || []);
      setEnergyLevel(dayData.energyLevel || 'medium');
      setReview(dayData.review || '');
      setCompletedCount(dayData.completedCount || 0);
    } else {
      setSchedules([]);
      setEnergyLevel('medium');
      setReview('');
      setCompletedCount(0);
    }
    setIsLoaded(true);
  }, [date]);

  // Persist whenever data changes (after initial load)
  const persist = useCallback(
    (s: ScheduleItem[], e: EnergyLevel, r: string, c: number) => {
      const days = loadAllDays();
      days[date] = { date, schedules: s, energyLevel: e, review: r, completedCount: c };
      saveAllDays(days);
    },
    [date]
  );

  const updateSchedules = useCallback(
    (fn: (prev: ScheduleItem[]) => ScheduleItem[]) => {
      setSchedules((prev) => {
        const next = fn(prev);
        persist(next, energyLevel, review, completedCount);
        return next;
      });
    },
    [energyLevel, review, completedCount, persist]
  );

  const updateEnergyLevel = useCallback(
    (level: EnergyLevel) => {
      setEnergyLevel(level);
      persist(schedules, level, review, completedCount);
    },
    [schedules, review, completedCount, persist]
  );

  const updateReview = useCallback(
    (text: string) => {
      setReview(text);
      persist(schedules, energyLevel, text, completedCount);
    },
    [schedules, energyLevel, completedCount, persist]
  );

  const updateCompletedCount = useCallback(
    (count: number) => {
      setCompletedCount(count);
      persist(schedules, energyLevel, review, count);
    },
    [schedules, energyLevel, review, persist]
  );

  // Weekly stats helper
  const getWeeklyStats = useCallback(() => {
    const days = loadAllDays();
    const today = new Date(date);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    let totalSchedules = 0;
    let totalCompleted = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const dayData = days[key];
      if (dayData) {
        totalSchedules += dayData.schedules?.length || 0;
        totalCompleted += dayData.completedCount || 0;
      }
    }
    return { totalSchedules, totalCompleted };
  }, [date]);

  return {
    schedules,
    energyLevel,
    review,
    completedCount,
    isLoaded,
    updateSchedules,
    updateEnergyLevel,
    updateReview,
    updateCompletedCount,
    getWeeklyStats,
  };
}
