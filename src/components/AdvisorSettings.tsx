'use client';

import { useState } from 'react';
import { Advisor } from '@/types/schedule';

interface AdvisorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  allAdvisors: Advisor[];
  selectedIds: string[];
  onSave: (ids: string[], customNames?: string[]) => void;
}

export function AdvisorSettings({
  isOpen,
  onClose,
  allAdvisors,
  selectedIds,
  onSave,
}: AdvisorSettingsProps) {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [name3, setName3] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const names = [name1, name2, name3].map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return;

    // Match against known advisors first, pass rest as custom
    const matchedIds: string[] = [];
    const customNames: string[] = [];

    for (const name of names) {
      const found = allAdvisors.find(
        (a) =>
          a.name === name ||
          a.nameEn.toLowerCase() === name.toLowerCase() ||
          a.initials.toLowerCase() === name.toLowerCase()
      );
      if (found) {
        matchedIds.push(found.id);
      } else {
        customNames.push(name);
      }
    }

    onSave(matchedIds, customNames.length > 0 ? customNames : undefined);
    onClose();
  };

  const handleRandom = () => {
    const shuffled = [...allAdvisors].sort(() => Math.random() - 0.5);
    setName1(shuffled[0]?.name || '');
    setName2(shuffled[1]?.name || '');
    setName3(shuffled[2]?.name || '');
  };

  const filledCount = [name1, name2, name3].filter(s => s.trim()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="rounded-2xl w-[92%] max-w-md max-h-[85vh] flex flex-col"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--color-text)' }}>
            💬 조언자 설정
          </h2>
          <p className="text-[14px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            원하는 3명의 조언자를 직접 입력하세요
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 3 input fields */}
          <div className="space-y-3">
            {[
              { value: name1, set: setName1, label: '1번 조언자', emoji: '🥇' },
              { value: name2, set: setName2, label: '2번 조언자', emoji: '🥈' },
              { value: name3, set: setName3, label: '3번 조언자', emoji: '🥉' },
            ].map((field, idx) => (
              <div key={idx}>
                <label className="text-[14px] font-semibold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  {field.emoji} {field.label}
                </label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder="예: 일론 머스크, 유재석, 손흥민..."
                  className="w-full"
                  style={{ fontSize: '16px' }}
                />
              </div>
            ))}
          </div>

          {/* Random button */}
          <button
            onClick={handleRandom}
            className="w-full py-3 rounded-xl text-[16px] font-semibold transition-all"
            style={{
              background: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              border: '1.5px dashed var(--color-accent)',
            }}
          >
            🎲 랜덤 추천
          </button>

          {/* Quick pick from pool */}
          <div className="rounded-xl p-3" style={{ background: 'var(--color-surface)' }}>
            <p className="text-[13px] font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              ⚡ 빠른 선택 (클릭하면 빈칸에 추가)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allAdvisors.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    if (!name1.trim()) setName1(a.name);
                    else if (!name2.trim()) setName2(a.name);
                    else if (!name3.trim()) setName3(a.name);
                  }}
                  className="text-[12px] px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
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
            disabled={filledCount === 0}
            className="btn-primary px-6 py-2.5 text-[15px] rounded-xl disabled:opacity-50"
          >
            ✅ 저장 ({filledCount}/3)
          </button>
        </div>
      </div>
    </div>
  );
}
