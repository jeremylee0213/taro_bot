import { ScheduleItem, EnergyLevel } from '@/types/schedule';

/** Convert "HH:mm" to minutes since midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Check overload: 6+ items or 3+ high priority */
export function checkOverload(items: ScheduleItem[]): string | null {
  const highCount = items.filter((i) => i.priority === 'high').length;
  if (items.length >= 6 && highCount >= 3) {
    return `일정 ${items.length}개, 고중요도 ${highCount}개 — 과부하 주의! 일부 일정을 축소하거나 위임하세요.`;
  }
  if (items.length >= 6) {
    return `일정이 ${items.length}개입니다. 에너지 배분에 유의하세요.`;
  }
  if (highCount >= 3) {
    return `고중요도 일정이 ${highCount}개입니다. 중간에 반드시 휴식을 넣으세요.`;
  }
  return null;
}

/** Find consecutive meeting blocks > 2 hours and suggest recovery */
export function findRecoverySuggestions(items: ScheduleItem[]): string[] {
  if (items.length < 2) return [];

  const sorted = [...items].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const suggestions: string[] = [];

  let blockStart = sorted[0].startTime;
  let blockEnd = sorted[0].endTime;

  for (let i = 1; i < sorted.length; i++) {
    const gap = timeToMinutes(sorted[i].startTime) - timeToMinutes(blockEnd);
    if (gap <= 15) {
      // continuous block
      blockEnd = sorted[i].endTime;
    } else {
      // check block length
      if (timeToMinutes(blockEnd) - timeToMinutes(blockStart) >= 120) {
        suggestions.push(`${blockStart}~${blockEnd} 연속 미팅 구간에 10~15분 회복 시간을 넣으세요.`);
      }
      blockStart = sorted[i].startTime;
      blockEnd = sorted[i].endTime;
    }
  }
  // Check last block
  if (timeToMinutes(blockEnd) - timeToMinutes(blockStart) >= 120) {
    suggestions.push(`${blockStart}~${blockEnd} 연속 미팅 구간에 10~15분 회복 시간을 넣으세요.`);
  }

  return suggestions;
}

/** Check if it's a rest day (no work schedules or all personal/health) */
export function isRestDay(items: ScheduleItem[]): boolean {
  if (items.length === 0) return true;
  return items.every((i) => i.category === 'personal' || i.category === 'health');
}

/** Get energy-based strategy tip */
export function getEnergyTip(energy: EnergyLevel, items: ScheduleItem[]): string | null {
  const highItems = items.filter((i) => i.priority === 'high');
  if (energy === 'low' && highItems.length > 0) {
    return '에너지가 낮은 날입니다. 고중요도 일정에 에너지를 집중하고, 나머지는 최대한 단순화하세요.';
  }
  if (energy === 'low' && highItems.length === 0) {
    return '에너지가 낮은 날입니다. 무리하지 말고, 핵심 업무만 처리하세요.';
  }
  if (energy === 'high' && highItems.length > 0) {
    return '에너지가 좋은 날입니다! 도전적인 목표를 세워보세요.';
  }
  return null;
}

/** Format date to Korean display */
export function formatDateKorean(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = days[d.getDay()];
  return `${y}년 ${m}월 ${day}일 (${dow})`;
}

/** Get today's date as YYYY-MM-DD */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}
