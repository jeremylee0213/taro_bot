'use client';

import { useState } from 'react';
import { ScheduleItem, Priority, Category, Emotion, SchedulePreset } from '@/types/schedule';

interface ScheduleFormProps {
  schedules: ScheduleItem[];
  onUpdate: (fn: (prev: ScheduleItem[]) => ScheduleItem[]) => void;
  onAnalyze: () => void;
  onRestDay: () => void;
}

const PRESETS: SchedulePreset[] = [
  {
    name: '일반 업무일',
    items: [
      { startTime: '09:00', endTime: '10:00', title: '메일 확인 및 업무 정리', priority: 'medium', category: 'work', emotion: 'normal' },
      { startTime: '10:00', endTime: '12:00', title: '핵심 업무 집중', priority: 'high', category: 'work', emotion: 'normal' },
      { startTime: '13:00', endTime: '14:00', title: '팀 미팅', priority: 'medium', category: 'work', emotion: 'normal' },
      { startTime: '14:00', endTime: '17:00', title: '프로젝트 작업', priority: 'medium', category: 'work', emotion: 'normal' },
    ],
  },
  {
    name: '미팅 집중일',
    items: [
      { startTime: '09:00', endTime: '10:00', title: '오전 미팅 1', priority: 'high', category: 'work', emotion: 'normal' },
      { startTime: '10:30', endTime: '11:30', title: '오전 미팅 2', priority: 'high', category: 'work', emotion: 'normal' },
      { startTime: '13:00', endTime: '14:00', title: '오후 미팅 1', priority: 'medium', category: 'work', emotion: 'normal' },
      { startTime: '14:30', endTime: '15:30', title: '오후 미팅 2', priority: 'medium', category: 'work', emotion: 'normal' },
      { startTime: '16:00', endTime: '17:00', title: '미팅 정리 및 팔로업', priority: 'medium', category: 'work', emotion: 'normal' },
    ],
  },
  {
    name: '균형 잡힌 하루',
    items: [
      { startTime: '07:00', endTime: '08:00', title: '운동', priority: 'medium', category: 'health', emotion: 'excited' },
      { startTime: '09:00', endTime: '12:00', title: '핵심 업무', priority: 'high', category: 'work', emotion: 'normal' },
      { startTime: '13:00', endTime: '15:00', title: '협업 및 미팅', priority: 'medium', category: 'work', emotion: 'normal' },
      { startTime: '17:30', endTime: '19:00', title: '가족 시간', priority: 'high', category: 'family', emotion: 'excited' },
    ],
  },
];

const PRIORITY_LABELS: Record<Priority, { label: string; color: string }> = {
  high: { label: '높음', color: 'text-priority-high' },
  medium: { label: '보통', color: 'text-priority-medium' },
  low: { label: '낮음', color: 'text-priority-low' },
};

const CATEGORY_LABELS: Record<Category, { label: string; emoji: string }> = {
  work: { label: '업무', emoji: '💼' },
  family: { label: '가족', emoji: '🏠' },
  personal: { label: '개인', emoji: '👤' },
  health: { label: '건강', emoji: '🏃' },
};

const EMOTION_OPTIONS: { value: Emotion; label: string; emoji: string }[] = [
  { value: 'excited', label: '기대', emoji: '😊' },
  { value: 'nervous', label: '긴장', emoji: '😰' },
  { value: 'burdened', label: '부담', emoji: '😓' },
  { value: 'normal', label: '평범', emoji: '😐' },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

interface EditingItem {
  startTime: string;
  endTime: string;
  title: string;
  priority: Priority;
  category: Category;
  emotion: Emotion;
}

const DEFAULT_ITEM: EditingItem = {
  startTime: '09:00',
  endTime: '10:00',
  title: '',
  priority: 'medium',
  category: 'work',
  emotion: 'normal',
};

export function ScheduleForm({ schedules, onUpdate, onAnalyze, onRestDay }: ScheduleFormProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditingItem>(DEFAULT_ITEM);
  const [showPresets, setShowPresets] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const sorted = [...schedules].sort(
    (a, b) => a.startTime.localeCompare(b.startTime)
  );

  const handleAdd = () => {
    if (!form.title.trim()) return;
    const item: ScheduleItem = { id: generateId(), ...form };
    onUpdate((prev) => [...prev, item]);
    setForm(DEFAULT_ITEM);
    setShowAddForm(false);
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setForm({
      startTime: item.startTime,
      endTime: item.endTime,
      title: item.title,
      priority: item.priority,
      category: item.category,
      emotion: item.emotion,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.title.trim()) return;
    onUpdate((prev) =>
      prev.map((s) => (s.id === editingId ? { ...s, ...form } : s))
    );
    setEditingId(null);
    setForm(DEFAULT_ITEM);
  };

  const handleDelete = (id: string) => {
    onUpdate((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(DEFAULT_ITEM);
    }
  };

  const applyPreset = (preset: SchedulePreset) => {
    const items = preset.items.map((item) => ({ id: generateId(), ...item }));
    onUpdate(() => items);
    setShowPresets(false);
  };

  // Drag & drop reorder
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    onUpdate((prev) => {
      const items = [...prev];
      const [moved] = items.splice(dragIdx, 1);
      items.splice(idx, 0, moved);
      return items;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const renderForm = (isEdit: boolean) => (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 fade-in">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-text-muted block mb-1">시작</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-text-muted block mb-1">종료</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-text-muted block mb-1">일정 제목</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="일정을 입력하세요"
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-text-muted block mb-1">중요도</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
          >
            {(Object.entries(PRIORITY_LABELS) as [Priority, { label: string }][]).map(([v, l]) => (
              <option key={v} value={v}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-text-muted block mb-1">카테고리</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
          >
            {(Object.entries(CATEGORY_LABELS) as [Category, { label: string; emoji: string }][]).map(([v, l]) => (
              <option key={v} value={v}>{l.emoji} {l.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-text-muted block mb-1">감정</label>
          <select
            value={form.emotion}
            onChange={(e) => setForm({ ...form, emotion: e.target.value as Emotion })}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
          >
            {EMOTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { setShowAddForm(false); setEditingId(null); setForm(DEFAULT_ITEM); }}
          className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary"
        >
          취소
        </button>
        <button
          onClick={isEdit ? handleSaveEdit : handleAdd}
          disabled={!form.title.trim()}
          className="btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
        >
          {isEdit ? '수정' : '추가'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header + Preset */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">📅 오늘의 일정</h2>
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="text-xs text-accent hover:underline"
          >
            프리셋
          </button>
          {showPresets && (
            <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-10 w-48">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface first:rounded-t-lg last:rounded-b-lg"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule list */}
      <div className="space-y-2">
        {sorted.map((item, idx) => (
          <div key={item.id}>
            {editingId === item.id ? (
              renderForm(true)
            ) : (
              <div
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`bg-card border border-border rounded-xl px-4 py-3 transition-colors ${
                  dragIdx === idx ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      {item.startTime}~{item.endTime}
                    </span>
                    <span className="text-sm text-text-primary truncate">{item.title}</span>
                    <span className={`text-xs font-bold ${PRIORITY_LABELS[item.priority].color}`}>
                      ●
                    </span>
                    <span className="text-xs">{CATEGORY_LABELS[item.category].emoji}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <span className="text-xs">
                      {EMOTION_OPTIONS.find((o) => o.value === item.emotion)?.emoji}
                    </span>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-1.5 py-0.5 text-[10px] text-text-muted hover:text-accent"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-1.5 py-0.5 text-[10px] text-text-muted hover:text-danger"
                    >
                      삭제
                    </button>
                    <span className="text-text-muted cursor-grab text-xs">≡</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add form or button */}
      {showAddForm ? (
        renderForm(false)
      ) : (
        <button
          onClick={() => { setShowAddForm(true); setForm(DEFAULT_ITEM); }}
          className="w-full border border-dashed border-border rounded-xl py-3 text-sm text-text-muted hover:text-accent hover:border-accent transition-colors"
        >
          + 일정 추가
        </button>
      )}

      {/* Action buttons */}
      {schedules.length > 0 && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={onAnalyze}
            className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-medium"
          >
            🔍 분석하기
          </button>
          <button
            onClick={onRestDay}
            className="px-4 py-2.5 rounded-xl text-sm border border-border text-text-secondary hover:bg-surface transition-colors"
          >
            🛋️ 쉬는 날
          </button>
        </div>
      )}
    </div>
  );
}
