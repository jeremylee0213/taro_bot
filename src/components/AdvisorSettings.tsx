'use client';

import { useState } from 'react';
import { Advisor } from '@/types/schedule';

interface AdvisorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  allAdvisors: Advisor[];
  selectedIds: string[];
  onSave: (ids: string[]) => void;
}

export function AdvisorSettings({
  isOpen,
  onClose,
  allAdvisors,
  selectedIds,
  onSave,
}: AdvisorSettingsProps) {
  const [selected, setSelected] = useState<string[]>(selectedIds);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl w-[90%] max-w-md max-h-[80vh] flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">조언자 선택 (최대 3명)</h2>
          <p className="text-xs text-text-muted mt-1">
            선택: {selected.length}/3
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {allAdvisors.map((advisor) => {
            const isSelected = selected.includes(advisor.id);
            return (
              <button
                key={advisor.id}
                onClick={() => toggle(advisor.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-muted w-6">
                    {advisor.initials}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-text-primary">
                      {advisor.name}
                      <span className="text-text-muted ml-1">({advisor.nameEn})</span>
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">{advisor.description}</p>
                  </div>
                  {isSelected && <span className="ml-auto text-accent text-sm">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-text-muted hover:text-text-secondary"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={selected.length === 0}
            className="btn-primary px-4 py-2 text-xs rounded-lg disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
