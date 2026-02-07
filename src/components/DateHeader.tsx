'use client';

import { EnergyLevel } from '@/types/schedule';
import { formatDateKorean } from '@/lib/schedule-utils';

interface DateHeaderProps {
  date: string;
  onDateChange: (date: string) => void;
  energyLevel: EnergyLevel;
  onEnergyChange: (level: EnergyLevel) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: 'high', label: '좋음', emoji: '😊' },
  { value: 'medium', label: '보통', emoji: '😐' },
  { value: 'low', label: '낮음', emoji: '😔' },
];

export function DateHeader({
  date,
  onDateChange,
  energyLevel,
  onEnergyChange,
  theme,
  onToggleTheme,
  onOpenSettings,
}: DateHeaderProps) {
  return (
    <header className="apple-card px-5 py-4" style={{ borderRadius: 0, borderBottom: '1px solid var(--color-border)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Daily CEO Planner</h1>
          <div className="flex items-center gap-3">
            <button onClick={onToggleTheme} className="text-xl p-1" aria-label="테마 전환">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={onOpenSettings} className="text-xl p-1" aria-label="설정">
              ⚙️
            </button>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[17px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {formatDateKorean(date)}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-[15px] px-2 py-1 rounded-lg"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[15px]" style={{ color: 'var(--color-text-muted)' }}>컨디션</span>
            <select
              value={energyLevel}
              onChange={(e) => onEnergyChange(e.target.value as EnergyLevel)}
              className="text-[16px] px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {ENERGY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
