'use client';

import { useState } from 'react';
import { Advisor } from '@/types/schedule';

type InputMode = 'select' | 'custom';

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
  const [mode, setMode] = useState<InputMode>('select');
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [customText, setCustomText] = useState('');

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleRandom = () => {
    const shuffled = [...allAdvisors].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3).map((a) => a.id);
    setSelected(picked);
  };

  const handleSave = () => {
    if (mode === 'custom' && customText.trim()) {
      // Parse custom input: match advisor names from the pool
      const names = customText.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean);
      const matchedIds: string[] = [];
      for (const name of names) {
        const found = allAdvisors.find(
          (a) =>
            a.name === name ||
            a.nameEn.toLowerCase() === name.toLowerCase() ||
            a.initials.toLowerCase() === name.toLowerCase()
        );
        if (found && !matchedIds.includes(found.id)) {
          matchedIds.push(found.id);
        }
      }
      if (matchedIds.length > 0) {
        onSave(matchedIds.slice(0, 3));
      } else {
        // If no matches, show alert-like feedback - just use random
        handleRandom();
        return;
      }
    } else {
      onSave(selected);
    }
    onClose();
  };

  const selectedNames = selected
    .map((id) => allAdvisors.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => a!.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="rounded-2xl w-[92%] max-w-md max-h-[85vh] flex flex-col"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-[17px] font-bold" style={{ color: 'var(--color-text)' }}>
            💬 조언자 설정
          </h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            최대 3명의 조언자를 선택하세요
          </p>

          {/* Mode toggle */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setMode('select')}
              className="flex-1 py-2 rounded-xl text-[14px] font-semibold transition-all"
              style={{
                background: mode === 'select' ? 'var(--color-accent)' : 'var(--color-surface)',
                color: mode === 'select' ? '#fff' : 'var(--color-text-secondary)',
                border: mode === 'select' ? 'none' : '1px solid var(--color-border)',
              }}
            >
              📋 목록에서 선택
            </button>
            <button
              onClick={() => setMode('custom')}
              className="flex-1 py-2 rounded-xl text-[14px] font-semibold transition-all"
              style={{
                background: mode === 'custom' ? 'var(--color-accent)' : 'var(--color-surface)',
                color: mode === 'custom' ? '#fff' : 'var(--color-text-secondary)',
                border: mode === 'custom' ? 'none' : '1px solid var(--color-border)',
              }}
            >
              ✏️ 직접 입력
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'select' && (
            <div className="space-y-2">
              {/* Random button */}
              <button
                onClick={handleRandom}
                className="w-full py-3 rounded-xl text-[15px] font-semibold transition-all mb-3"
                style={{
                  background: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  border: '1.5px dashed var(--color-accent)',
                }}
              >
                🎲 랜덤 선택
              </button>

              {/* Selected indicator */}
              {selectedNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedNames.map((name) => (
                    <span
                      key={name}
                      className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'var(--color-accent)', color: '#fff' }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {/* Advisor list */}
              {allAdvisors.map((advisor) => {
                const isSelected = selected.includes(advisor.id);
                return (
                  <button
                    key={advisor.id}
                    onClick={() => toggle(advisor.id)}
                    className="w-full text-left px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: isSelected ? 'var(--color-accent-light)' : 'var(--color-surface)',
                      border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[13px] font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          color: '#fff',
                        }}
                      >
                        {advisor.initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
                          {advisor.name}
                          <span className="text-[13px] ml-1" style={{ color: 'var(--color-text-muted)' }}>
                            {advisor.nameEn}
                          </span>
                        </p>
                        <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
                          {advisor.description}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="text-[16px]" style={{ color: 'var(--color-accent)' }}>✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {mode === 'custom' && (
            <div className="space-y-4">
              <p className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                조언자 이름을 쉼표(,)로 구분하여 입력하세요.
                <br />
                목록에 있는 인물의 이름, 영문명, 이니셜 중 하나로 입력합니다.
              </p>

              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="예: 일론 머스크, Steve Jobs, BG"
                className="w-full h-32 rounded-xl resize-none"
                style={{
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text)',
                  padding: '12px 16px',
                  fontSize: '15px',
                }}
              />

              {/* Quick reference */}
              <div className="rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
                <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  사용 가능한 조언자 목록:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allAdvisors.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        const current = customText.trim();
                        const newText = current ? `${current}, ${a.name}` : a.name;
                        setCustomText(newText);
                      }}
                      className="text-[12px] px-2 py-1 rounded-lg transition-all"
                      style={{
                        background: 'var(--color-bg)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {a.initials} {a.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Random button for custom mode too */}
              <button
                onClick={() => {
                  const shuffled = [...allAdvisors].sort(() => Math.random() - 0.5);
                  const picked = shuffled.slice(0, 3);
                  setCustomText(picked.map((a) => a.name).join(', '));
                }}
                className="w-full py-3 rounded-xl text-[15px] font-semibold transition-all"
                style={{
                  background: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  border: '1.5px dashed var(--color-accent)',
                }}
              >
                🎲 랜덤으로 채우기
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex justify-end gap-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[15px] font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={mode === 'select' ? selected.length === 0 : !customText.trim()}
            className="btn-primary px-6 py-2.5 text-[15px] rounded-xl disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
