'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ScheduleItem } from '@/types/schedule';

interface QuickInputProps {
  onAnalyze: (items: ScheduleItem[]) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  work: { emoji: '💼', label: '업무' },
  family: { emoji: '🏠', label: '가족' },
  personal: { emoji: '👤', label: '개인' },
  health: { emoji: '🏃', label: '건강' },
};

function parseScheduleText(text: string): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  const parts = text.split(/[,\n.]+/).map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    const ampmMatch = part.match(/^(오전|오후)\s*/);
    const isPM = ampmMatch?.[1] === '오후';
    const cleaned = ampmMatch ? part.replace(/^(오전|오후)\s*/, '') : part;

    const match = cleaned.match(
      /^(\d{1,2})(?::(\d{2}))?(?:시)?(?:반)?(?:\s*[~\-]\s*(\d{1,2})(?::(\d{2}))?(?:시)?(?:반)?)?\s+(.+)$/
    );

    if (match) {
      let startH = parseInt(match[1]);
      let startM = match[2] ? parseInt(match[2]) : 0;
      if (part.includes('반') && startM === 0) startM = 30;
      if (isPM && startH < 12) startH += 12;

      let endH = match[3] ? parseInt(match[3]) : startH + 1;
      const endM = match[4] ? parseInt(match[4]) : 0;
      if (match[3] && isPM && endH < 12) endH += 12;
      if (endH <= startH && !match[3]) endH = startH + 1;

      const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const title = match[5].trim();

      let category: ScheduleItem['category'] = 'work';
      if (/운동|러닝|헬스|요가|산책|수영|걷기|조깅|스트레칭/.test(title)) category = 'health';
      else if (/가족|아이|아내|남편|부모|저녁식사|데이트|아들|딸/.test(title)) category = 'family';
      else if (/명상|독서|기록|일기|취미|영화|음악|휴식|낮잠|저널링/.test(title)) category = 'personal';

      let priority: ScheduleItem['priority'] = 'medium';
      if (/미팅|발표|면접|투자|계약|중요|프레젠|보고/.test(title)) priority = 'high';
      else if (/정리|메일|확인|체크|청소/.test(title)) priority = 'low';

      items.push({ id: generateId(), startTime, endTime, title, priority, category, emotion: 'normal' });
    }
  }

  return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function QuickInput({ onAnalyze }: QuickInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [reorderedItems, setReorderedItems] = useState<ScheduleItem[] | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(56, textareaRef.current.scrollHeight) + 'px';
    }
  }, [text]);

  const parsedItems = useMemo(() => parseScheduleText(text), [text]);
  const displayItems = reorderedItems || parsedItems;

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  }, []);

  const handleDrop = useCallback((idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const items = [...displayItems];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(idx, 0, moved);
    setReorderedItems(items);
    setDragIdx(null);
    setOverIdx(null);
  }, [dragIdx, displayItems]);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  useEffect(() => {
    setReorderedItems(null);
  }, [text]);

  const handleAnalyze = (restMode: boolean) => {
    const items = restMode ? [] : displayItems;
    if (!restMode && items.length === 0) return;
    onAnalyze(items);
  };

  return (
    <div className="apple-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📝</span>
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          오늘의 일정
        </h3>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"일정을 자유롭게 입력하세요\n예: 9시 투자자미팅, 11시 팀회의\n14시~16시 프로젝트, 18시 러닝"}
        className="w-full resize-none min-h-[80px] max-h-[300px]"
        rows={3}
        style={{ fontSize: '17px', lineHeight: '1.6' }}
      />

      {displayItems.length > 0 && (
        <div className="space-y-2 fade-in">
          <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            인식된 일정 ({displayItems.length}개) — 드래그로 순서 변경
          </p>
          <div className="space-y-1.5">
            {displayItems.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
                  dragIdx === idx ? 'dragging' : ''
                } ${overIdx === idx && dragIdx !== idx ? 'drag-over' : ''}`}
                style={{ background: 'var(--color-surface)' }}
              >
                <span className="drag-handle text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
                  ≡
                </span>
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{
                    background:
                      item.priority === 'high'
                        ? 'var(--color-priority-high)'
                        : item.priority === 'medium'
                        ? 'var(--color-priority-medium)'
                        : 'var(--color-priority-low)',
                  }}
                />
                <span className="text-[15px]" style={{ color: 'var(--color-text-muted)' }}>
                  {item.startTime}~{item.endTime}
                </span>
                <span className="text-[16px] font-medium flex-1" style={{ color: 'var(--color-text)' }}>
                  {item.title}
                </span>
                <span className="text-[14px]">
                  {CATEGORY_LABELS[item.category]?.emoji}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => handleAnalyze(false)}
          disabled={displayItems.length === 0}
          className="btn-primary py-4 disabled:opacity-40 text-[17px]"
        >
          💼 일하는 날
        </button>
        <button
          onClick={() => handleAnalyze(true)}
          className="btn-secondary py-4 text-[17px]"
        >
          🛋️ 쉬는 날
        </button>
      </div>

      {displayItems.length === 0 && text.trim().length === 0 && (
        <p className="text-center text-[14px] pt-1" style={{ color: 'var(--color-text-muted)' }}>
          시간 + 할 일을 입력하면 자동으로 인식됩니다
        </p>
      )}

      {text.trim().length > 0 && displayItems.length === 0 && (
        <p className="text-center text-[14px] pt-1" style={{ color: 'var(--color-priority-high)' }}>
          ⚠️ 시간을 인식하지 못했어요 — &quot;9시 회의&quot; 형식으로 입력해주세요
        </p>
      )}
    </div>
  );
}

export { parseScheduleText };
