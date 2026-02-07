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
    <header className="bg-surface border-b border-border px-4 py-3 shadow-sm">
      <div className="max-w-2xl mx-auto">
        {/* Top row: Title + controls */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-text-primary">Daily CEO Planner</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg hover:bg-border/50 transition-colors text-sm"
              aria-label="테마 전환"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-border/50 transition-colors text-sm"
              aria-label="설정"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Bottom row: Date + Energy */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">{formatDateKorean(date)}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs bg-transparent border border-border rounded px-1.5 py-0.5 text-text-secondary cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">컨디션:</span>
            <select
              value={energyLevel}
              onChange={(e) => onEnergyChange(e.target.value as EnergyLevel)}
              className="text-xs bg-surface border border-border rounded px-2 py-1 text-text-primary"
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
