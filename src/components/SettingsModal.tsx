'use client';

import { useState, useEffect } from 'react';
import { UserProfile, ConcertaDose } from '@/types/schedule';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  model: string;
  onSaveModel: (model: string) => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'gpt-4.5-preview', label: 'GPT-4.5 Preview' },
  { value: 'gpt-5.2', label: 'GPT-5.2' },
];

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  model,
  onSaveModel,
  profile,
  onSaveProfile,
}: SettingsModalProps) {
  const [tab, setTab] = useState<'api' | 'profile'>('api');
  const [keyInput, setKeyInput] = useState(apiKey);
  const [selectedModel, setSelectedModel] = useState(model);
  const [form, setForm] = useState<UserProfile>(profile);

  useEffect(() => {
    setKeyInput(apiKey);
    setSelectedModel(model);
    setForm(profile);
  }, [apiKey, model, profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onSaveModel(selectedModel);
    onSaveProfile(form);
    onClose();
  };

  const concertaDoses = form.concertaDoses || [];

  const addDose = () => {
    setForm({
      ...form,
      concertaDoses: [...concertaDoses, { time: '08:00', doseMg: 27 }],
    });
  };

  const updateDose = (idx: number, field: keyof ConcertaDose, value: string | number) => {
    const updated = [...concertaDoses];
    if (field === 'time') updated[idx] = { ...updated[idx], time: value as string };
    if (field === 'doseMg') updated[idx] = { ...updated[idx], doseMg: Number(value) };
    setForm({ ...form, concertaDoses: updated });
  };

  const removeDose = (idx: number) => {
    setForm({ ...form, concertaDoses: concertaDoses.filter((_, i) => i !== idx) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="apple-card w-[92%] max-w-md p-6 space-y-5" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 className="text-[22px] font-bold" style={{ color: 'var(--color-text)' }}>⚙️ 설정</h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('api')}
            className="flex-1 py-2.5 rounded-xl text-[16px] font-semibold transition-all"
            style={{
              background: tab === 'api' ? 'var(--color-accent)' : 'var(--color-surface)',
              color: tab === 'api' ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            🔑 API 설정
          </button>
          <button
            onClick={() => setTab('profile')}
            className="flex-1 py-2.5 rounded-xl text-[16px] font-semibold transition-all"
            style={{
              background: tab === 'profile' ? 'var(--color-accent)' : 'var(--color-surface)',
              color: tab === 'profile' ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            👤 내 프로필
          </button>
        </div>

        {/* API Tab */}
        {tab === 'api' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>🔑 OpenAI API Key</label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full"
              />
              <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
                🔒 브라우저에만 저장됩니다
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>🤖 모델</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>🧠 기질 특성</label>
              <input
                type="text"
                value={form.traits.join(', ')}
                onChange={(e) => setForm({ ...form, traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="조용한 ADHD, HSP"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>💊 복용 약물</label>
              <input
                type="text"
                value={form.medications.join(', ')}
                onChange={(e) => setForm({ ...form, medications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="아토목신 10mg, 콘서타 27mg"
                className="w-full"
              />
            </div>

            {/* ─── Concerta Dosing Schedule ─── */}
            <div className="space-y-3">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>
                💊 콘서타 복용 스케줄
              </label>
              <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                복용 시간과 용량을 입력하면 농도 곡선이 생성됩니다
              </p>

              {concertaDoses.map((dose, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <span className="text-[18px]">🕐</span>
                  <input
                    type="time"
                    value={dose.time}
                    onChange={(e) => updateDose(idx, 'time', e.target.value)}
                    className="flex-1"
                    style={{ minWidth: '100px' }}
                  />
                  <select
                    value={dose.doseMg}
                    onChange={(e) => updateDose(idx, 'doseMg', Number(e.target.value))}
                    className="flex-1"
                  >
                    {[17, 18, 27, 36, 54].map((mg) => (
                      <option key={mg} value={mg}>{mg}mg</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeDose(idx)}
                    className="text-[18px] p-1"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={addDose}
                className="w-full py-2.5 rounded-xl text-[15px] font-semibold"
                style={{
                  background: 'var(--color-accent-light)',
                  color: 'var(--color-accent)',
                  border: '1.5px dashed var(--color-accent)',
                }}
              >
                ➕ 복용 시간 추가
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>🎯 선호 활동</label>
              <input
                type="text"
                value={form.preferences.join(', ')}
                onChange={(e) => setForm({ ...form, preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="러닝, 명상, 독서"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>😴 수면 목표</label>
              <input
                type="text"
                value={form.sleepGoal}
                onChange={(e) => setForm({ ...form, sleepGoal: e.target.value })}
                placeholder="23:00~07:00"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>📝 메모</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="기타 참고사항"
                className="w-full h-20 resize-none"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-3"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1 py-3"
          >
            💾 저장
          </button>
        </div>
      </div>
    </div>
  );
}
