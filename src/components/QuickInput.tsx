'use client';

import { useState, useRef, useEffect } from 'react';
import { ScheduleItem } from '@/types/schedule';

interface QuickInputProps {
  onAddSchedules: (items: ScheduleItem[]) => void;
  onAnalyze: () => void;
  hasSchedules: boolean;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

/**
 * Parse text like "9시 투자자미팅, 11시 팀회의, 14시~16시 프로젝트"
 * into ScheduleItem[]
 */
function parseScheduleText(text: string): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  // Split by comma, newline, or period
  const parts = text.split(/[,\n.]+/).map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    // Pattern: "9시 제목", "09:00 제목", "9시~11시 제목", "09:00~11:00 제목", "14시반 제목"
    const match = part.match(
      /^(\d{1,2})(?::(\d{2}))?(?:시)?(?:반)?(?:\s*[~\-]\s*(\d{1,2})(?::(\d{2}))?(?:시)?(?:반)?)?\s+(.+)$/
    );

    if (match) {
      let startH = parseInt(match[1]);
      let startM = match[2] ? parseInt(match[2]) : 0;
      // "반" detection
      if (part.includes('반') && startM === 0) startM = 30;

      let endH = match[3] ? parseInt(match[3]) : startH + 1;
      let endM = match[4] ? parseInt(match[4]) : 0;
      if (endH <= startH && !match[3]) endH = startH + 1;

      const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const title = match[5].trim();

      // Auto-detect category
      let category: ScheduleItem['category'] = 'work';
      if (/운동|러닝|헬스|요가|산책|수영/.test(title)) category = 'health';
      else if (/가족|아이|아내|남편|부모|저녁식사|데이트/.test(title)) category = 'family';
      else if (/명상|독서|기록|일기|취미|영화|음악/.test(title)) category = 'personal';

      // Auto-detect priority
      let priority: ScheduleItem['priority'] = 'medium';
      if (/미팅|발표|면접|투자|계약|중요/.test(title)) priority = 'high';
      else if (/정리|메일|확인|체크/.test(title)) priority = 'low';

      items.push({
        id: generateId(),
        startTime,
        endTime,
        title,
        priority,
        category,
        emotion: 'normal',
      });
    }
  }

  return items;
}

export function QuickInput({ onAddSchedules, onAnalyze, hasSchedules }: QuickInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    const items = parseScheduleText(text);
    if (items.length > 0) {
      onAddSchedules(items);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="apple-card p-5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="일정을 입력하세요&#10;예: 9시 투자자미팅, 11시 팀회의, 14시~16시 프로젝트"
          className="w-full resize-none min-h-[56px] max-h-[200px]"
          rows={2}
          style={{ fontSize: '17px' }}
        />
        <div className="flex gap-3 mt-3">
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="btn-primary flex-1 py-3 disabled:opacity-40"
          >
            + 추가
          </button>
          {hasSchedules && (
            <button
              onClick={onAnalyze}
              className="btn-primary flex-1 py-3"
            >
              🔍 분석하기
            </button>
          )}
        </div>
      </div>

      {!hasSchedules && (
        <p className="text-center text-[15px]" style={{ color: 'var(--color-text-muted)' }}>
          시간과 일정을 적으면 자동으로 파싱됩니다
        </p>
      )}
    </div>
  );
}
