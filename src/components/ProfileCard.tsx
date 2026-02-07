'use client';

import { useState } from 'react';
import { UserProfile } from '@/types/schedule';

interface ProfileCardProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  traits: ['조용한 ADHD', 'HSP'],
  medications: ['아토목신 10mg', '아리피졸 2mg', '콘서타 27mg 오전', '콘서타 17mg 오후'],
  preferences: ['러닝', '수면', '독서', '명상', '기록'],
  sleepGoal: '23:00~07:00',
  notes: '',
};

export function ProfileCard({ profile, onSave }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<UserProfile>(profile);

  const handleSave = () => {
    onSave(form);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="profile-card p-5 space-y-4 fade-in">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>🧠 내 프로필</h3>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>기질 특성</label>
          <input
            type="text"
            value={form.traits.join(', ')}
            onChange={(e) => setForm({ ...form, traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="ADHD, HSP 등"
            className="w-full mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>복용 중인 약물</label>
          <input
            type="text"
            value={form.medications.join(', ')}
            onChange={(e) => setForm({ ...form, medications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="약물명 + 용량"
            className="w-full mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>선호 활동</label>
          <input
            type="text"
            value={form.preferences.join(', ')}
            onChange={(e) => setForm({ ...form, preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="러닝, 명상, 독서 등"
            className="w-full mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>수면 목표</label>
          <input
            type="text"
            value={form.sleepGoal}
            onChange={(e) => setForm({ ...form, sleepGoal: e.target.value })}
            placeholder="23:00~07:00"
            className="w-full mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>메모</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="기타 참고사항"
            className="w-full mt-1 h-20 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} className="btn-primary flex-1 py-3">저장</button>
          <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1 py-3">취소</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="profile-card p-5 fade-in cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>🧠 내 프로필</h3>
        <span className="text-sm" style={{ color: 'var(--color-accent)' }}>수정</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {profile.traits.map((t, i) => (
          <span key={i} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {t}
          </span>
        ))}
      </div>

      <div className="space-y-2 text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
        <p>💊 {profile.medications.join(' · ')}</p>
        <p>🎯 {profile.preferences.join(' · ')}</p>
        <p>😴 수면 목표: {profile.sleepGoal}</p>
        {profile.notes && <p>📝 {profile.notes}</p>}
      </div>
    </div>
  );
}

export { DEFAULT_PROFILE };
