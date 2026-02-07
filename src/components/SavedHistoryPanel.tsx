'use client';

import { useState, useEffect } from 'react';

export interface SavedAdvice {
  id: string;
  date: string;
  overallTip: string;
  advisors: { name: string; comment: string }[];
  neuroSummary?: string;
  timestamp: number;
}

const STORAGE_KEY = 'ceo-planner-saved-advice';

export function getSavedAdvices(): SavedAdvice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveAdvice(advice: SavedAdvice) {
  const list = getSavedAdvices();
  list.unshift(advice);
  // Keep max 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
}

export function deleteAdvice(id: string) {
  const list = getSavedAdvices().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

interface SavedHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedHistoryPanel({ isOpen, onClose }: SavedHistoryPanelProps) {
  const [items, setItems] = useState<SavedAdvice[]>([]);

  useEffect(() => {
    if (isOpen) setItems(getSavedAdvices());
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteAdvice(id);
    setItems(getSavedAdvices());
  };

  const handleCopy = async (item: SavedAdvice) => {
    const text = [
      `📅 ${item.date}`,
      `💡 ${item.overallTip}`,
      '',
      ...item.advisors.map(a => `💬 ${a.name}: "${a.comment}"`),
      item.neuroSummary ? `\n🧠 ${item.neuroSummary}` : '',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      )}

      {/* Side panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full flex flex-col transition-transform duration-300"
        style={{
          width: 'min(380px, 85vw)',
          background: 'var(--color-card)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--color-text)' }}>
            📚 저장된 조언
          </h2>
          <button
            onClick={onClose}
            className="text-[22px] p-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[32px] mb-3">📭</p>
              <p className="text-[16px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                저장된 조언이 없습니다
              </p>
              <p className="text-[14px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                분석 결과에서 💾 저장 버튼을 눌러주세요
              </p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                  📅 {item.date}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(item)}
                    className="text-[13px] px-2 py-1 rounded-lg"
                    style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-[13px] px-2 py-1 rounded-lg"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-[15px] font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                💡 {item.overallTip}
              </p>

              {item.advisors.map((a, i) => (
                <p key={i} className="text-[13px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  💬 <strong>{a.name}</strong>: {a.comment.length > 60 ? a.comment.slice(0, 60) + '...' : a.comment}
                </p>
              ))}

              {item.neuroSummary && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  🧠 {item.neuroSummary.length > 50 ? item.neuroSummary.slice(0, 50) + '...' : item.neuroSummary}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
