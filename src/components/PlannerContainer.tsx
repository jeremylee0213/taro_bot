'use client';

import { useState, useCallback } from 'react';
import {
  AnalysisResult,
  AnalysisProgress,
  AnalysisView,
  AdvisorTone,
  Advisor,
  UserProfile,
  ScheduleItem,
} from '@/types/schedule';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/hooks/useTheme';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';
import {
  checkOverload,
  findRecoverySuggestions,
  isRestDay,
  getEnergyTip,
  getToday,
} from '@/lib/schedule-utils';
import { assemblePrompt } from '@/lib/prompt-assembler';
import { parseResponse } from '@/lib/parse-response';
import { createOpenAI } from '@/lib/openai';

import { DateHeader } from './DateHeader';
import { QuickInput } from './QuickInput';
import { OverloadBanner } from './OverloadBanner';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { BlockCalendar } from './BlockCalendar';
import { BriefingCard } from './BriefingCard';
import { AdvisorPanel } from './AdvisorPanel';
import { AdvisorSettings } from './AdvisorSettings';
import { ReviewSection } from './ReviewSection';
import { AchievementTracker } from './AchievementTracker';
import { ShareButton } from './ShareButton';
import { SettingsModal } from './SettingsModal';
import { ProfileCard, DEFAULT_PROFILE } from './ProfileCard';

// ─── All Advisors ───
const ALL_ADVISORS: Advisor[] = [
  { id: 'em', name: '일론 머스크', nameEn: 'Elon Musk', initials: 'EM', description: '본질 집중, 과감한 결단', style: 'visionary' },
  { id: 'wb', name: '워런 버핏', nameEn: 'Warren Buffett', initials: 'WB', description: '장기적 가치, 인내', style: 'investor' },
  { id: 'sn', name: '사티아 나델라', nameEn: 'Satya Nadella', initials: 'SN', description: '성장 마인드셋, 공감', style: 'leader' },
  { id: 'jb', name: '제프 베조스', nameEn: 'Jeff Bezos', initials: 'JB', description: '고객 집중, Day 1 정신', style: 'founder' },
  { id: 'rd', name: '레이 달리오', nameEn: 'Ray Dalio', initials: 'RD', description: '원칙 중심, 시스템 사고', style: 'strategist' },
  { id: 'sj', name: '스티브 잡스', nameEn: 'Steve Jobs', initials: 'SJ', description: '단순함의 미학, 완벽주의', style: 'creative' },
  { id: 'bg', name: '빌 게이츠', nameEn: 'Bill Gates', initials: 'BG', description: '체계적 분석, 효율', style: 'analyst' },
  { id: 'jh', name: '젠슨 황', nameEn: 'Jensen Huang', initials: 'JH', description: '끈기, 비전 중심', style: 'builder' },
  { id: 'bn', name: '브레네 브라운', nameEn: 'Brené Brown', initials: 'BN', description: '취약성의 용기, 공감', style: 'empathy' },
  { id: 'ac', name: '아담 그랜트', nameEn: 'Adam Grant', initials: 'AC', description: '기버 정신, 재고', style: 'thinker' },
  { id: 'on', name: '오프라 윈프리', nameEn: 'Oprah Winfrey', initials: 'ON', description: '자기 인식, 감사', style: 'motivator' },
  { id: 'mj', name: '마이클 조던', nameEn: 'Michael Jordan', initials: 'MJ', description: '승부 근성, 절대 기준', style: 'competitor' },
  { id: 'pj', name: '필 잭슨', nameEn: 'Phil Jackson', initials: 'PJ', description: '마음챙김, 팀 조화', style: 'zen' },
  { id: 'lg', name: '이건희', nameEn: 'Lee Kun-hee', initials: 'LG', description: '위기의식, 질적 경영', style: 'reformer' },
  { id: 'by', name: '방시혁', nameEn: 'Bang Si-hyuk', initials: 'BY', description: '콘텐츠 직관, 글로벌', style: 'content' },
];

const DEFAULT_ADVISOR_IDS = ['em', 'wb', 'sn'];

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  work: { emoji: '💼', label: '업무' },
  family: { emoji: '🏠', label: '가족' },
  personal: { emoji: '👤', label: '개인' },
  health: { emoji: '🏃', label: '건강' },
};

export function PlannerContainer() {
  const [date, setDate] = useState(getToday());
  const [theme, toggleTheme] = useTheme();

  // Settings
  const [apiKey, setApiKey] = useLocalStorage('ceo-planner-apikey', '');
  const [model, setModel] = useLocalStorage('ceo-planner-model', 'gpt-4o');
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useLocalStorage<string[]>('ceo-planner-advisors', DEFAULT_ADVISOR_IDS);
  const [advisorTone, setAdvisorTone] = useLocalStorage<AdvisorTone>('ceo-planner-tone', 'encouraging');
  const [profile, setProfile] = useLocalStorage<UserProfile>('ceo-planner-profile', DEFAULT_PROFILE);

  // Schedule
  const {
    schedules, energyLevel, review, completedCount, isLoaded,
    updateSchedules, updateEnergyLevel, updateReview, updateCompletedCount, getWeeklyStats,
  } = useScheduleStore(date);

  // Analysis
  const [view, setView] = useState<AnalysisView>('form');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({ step: 0, total: 3, label: '' });
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvisorSettings, setShowAdvisorSettings] = useState(false);

  const { getCached, setCache } = useAnalysisCache();

  // Derived
  const overloadMsg = checkOverload(schedules);
  const recoverySuggestions = findRecoverySuggestions(schedules);
  const energyTip = getEnergyTip(energyLevel, schedules);
  const selectedAdvisors = ALL_ADVISORS.filter((a) => selectedAdvisorIds.includes(a.id));
  const weeklyStats = getWeeklyStats();

  // Schedule list display (sorted)
  const sortedSchedules = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // ─── Analysis handler ───
  const runAnalysis = useCallback(
    async (restMode = false) => {
      if (!apiKey) { setShowSettings(true); return; }

      const cached = getCached(schedules, energyLevel, selectedAdvisorIds);
      if (cached && !restMode) {
        setAnalysisResult(cached);
        setView('result');
        return;
      }

      setIsAnalyzing(true);
      setError(null);
      setView('result');

      try {
        setProgress({ step: 1, total: 3, label: '프롬프트 준비 중...' });
        const messages = assemblePrompt({
          schedules, energyLevel,
          advisors: selectedAdvisors,
          advisorTone,
          profile,
          isRestDay: restMode,
        });

        setProgress({ step: 2, total: 3, label: 'AI 분석 중...' });
        const openai = createOpenAI(apiKey);

        const useNewTokenParam = [
          'gpt-5.2', 'gpt-4.5-preview', 'gpt-4.1', 'gpt-4.1-mini',
          'o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini',
        ].some((m) => model.startsWith(m));

        const response = await openai.chat.completions.create({
          model,
          messages: messages as Parameters<typeof openai.chat.completions.create>[0]['messages'],
          response_format: { type: 'json_object' },
          ...(useNewTokenParam ? { max_completion_tokens: 4096 } : { max_tokens: 4096 }),
        });

        const raw = response.choices[0]?.message?.content || '';

        setProgress({ step: 3, total: 3, label: '결과 정리 중...' });
        const result = parseResponse(raw);

        setAnalysisResult(result);
        setCache(schedules, energyLevel, selectedAdvisorIds, result);
        updateCompletedCount(completedCount + schedules.length);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : '알 수 없는 오류';
        if (errMsg.includes('401') || errMsg.includes('Incorrect API key')) {
          setError('API 키가 올바르지 않습니다. 설정에서 확인해주세요.');
        } else if (errMsg.includes('429')) {
          setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(`오류가 발생했습니다: ${errMsg}`);
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    [apiKey, model, schedules, energyLevel, selectedAdvisors, selectedAdvisorIds, advisorTone, profile, completedCount, getCached, setCache, updateCompletedCount]
  );

  const handleAddSchedules = (items: ScheduleItem[]) => {
    updateSchedules((prev) => [...prev, ...items]);
  };

  const handleDeleteSchedule = (id: string) => {
    updateSchedules((prev) => prev.filter(s => s.id !== id));
  };

  const handleScrollToBriefing = (id: number) => {
    const el = document.getElementById(`briefing-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!isLoaded) return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <DateHeader
        date={date}
        onDateChange={setDate}
        energyLevel={energyLevel}
        onEnergyChange={updateEnergyLevel}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ─── FORM VIEW ─── */}
        {view === 'form' && (
          <>
            {/* Profile Card */}
            <ProfileCard profile={profile} onSave={setProfile} />

            {/* Quick Input */}
            <QuickInput
              onAddSchedules={handleAddSchedules}
              onAnalyze={() => runAnalysis(false)}
              hasSchedules={schedules.length > 0}
            />

            {/* Schedule List (visual) */}
            {sortedSchedules.length > 0 && (
              <div className="apple-card p-5 space-y-3 fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                    오늘의 일정 ({schedules.length}개)
                  </h3>
                  <button
                    onClick={() => updateSchedules(() => [])}
                    className="text-[15px]"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    전체 삭제
                  </button>
                </div>
                {sortedSchedules.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div
                      className="w-1 h-10 rounded-full flex-shrink-0"
                      style={{
                        background: item.priority === 'high' ? 'var(--color-priority-high)' :
                                    item.priority === 'medium' ? 'var(--color-priority-medium)' : 'var(--color-priority-low)'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-medium truncate" style={{ color: 'var(--color-text)' }}>{item.title}</p>
                      <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
                        {item.startTime}~{item.endTime} · {CATEGORY_LABELS[item.category]?.emoji} {CATEGORY_LABELS[item.category]?.label}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(item.id)}
                      className="text-[15px] px-2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => runAnalysis(false)} className="btn-primary flex-1 py-3">
                    🔍 분석하기
                  </button>
                  <button
                    onClick={() => runAnalysis(true)}
                    className="btn-secondary flex-1 py-3"
                  >
                    🛋️ 쉬는 날
                  </button>
                </div>
              </div>
            )}

            {/* Overload warnings */}
            <OverloadBanner overloadMessage={overloadMsg} recoverySuggestions={recoverySuggestions} energyTip={energyTip} />
          </>
        )}

        {/* ─── RESULT VIEW ─── */}
        {view === 'result' && (
          <>
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setView('form'); setError(null); }}
                className="text-[17px] font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                ← 일정 수정
              </button>
              {analysisResult && <ShareButton result={analysisResult} />}
            </div>

            {/* Loading */}
            {isAnalyzing && <AnalysisSkeleton progress={progress} />}

            {/* Error */}
            {error && (
              <div className="apple-card p-5 fade-in" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                <p className="text-[17px] mb-3" style={{ color: 'var(--color-text)' }}>{error}</p>
                <button onClick={() => runAnalysis(false)} className="btn-primary px-5 py-2.5">
                  다시 시도
                </button>
              </div>
            )}

            {/* Results */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-6 fade-in">
                {/* Overall tip */}
                {analysisResult.overall_tip && (
                  <div className="apple-card p-5" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                    <p className="text-[17px] font-medium" style={{ color: 'var(--color-text)' }}>
                      💡 {analysisResult.overall_tip}
                    </p>
                  </div>
                )}

                {/* Warnings */}
                {analysisResult.overload_warning && (
                  <div className="apple-card p-5" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                    <p className="text-[17px]" style={{ color: 'var(--color-text)' }}>⚠️ {analysisResult.overload_warning}</p>
                  </div>
                )}

                {/* Block Calendar */}
                <BlockCalendar
                  timeline={analysisResult.timeline}
                  neuroTips={analysisResult.neuro_tips}
                  onClickEntry={handleScrollToBriefing}
                />

                {/* Briefings */}
                {analysisResult.briefings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>📋 브리핑</h3>
                    {analysisResult.briefings.map((b, idx) => (
                      <BriefingCard key={b.id} briefing={b} defaultOpen={idx === 0} />
                    ))}
                  </div>
                )}

                {/* 🧠 Neuroscience Summary */}
                {analysisResult.daily_neuro_summary && (
                  <div className="neuro-card p-5 space-y-3 fade-in">
                    <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>🧠 오늘의 뇌과학 제안</h3>
                    <p className="text-[17px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {analysisResult.daily_neuro_summary}
                    </p>

                    {/* Neuro tips list */}
                    {analysisResult.neuro_tips.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {analysisResult.neuro_tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface)' }}>
                            <span className="text-2xl">{tip.emoji}</span>
                            <div>
                              <p className="text-[16px] font-semibold" style={{ color: 'var(--color-text)' }}>
                                {tip.label} · {tip.duration}분
                              </p>
                              <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
                                {tip.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Advisors */}
                <AdvisorPanel
                  advisors={analysisResult.advisors}
                  tone={advisorTone}
                  onChangeTone={setAdvisorTone}
                  onChangeAdvisors={() => setShowAdvisorSettings(true)}
                />

                {/* Recovery suggestions */}
                {analysisResult.recovery_suggestions.length > 0 && (
                  <div className="apple-card p-5 space-y-2" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>💚 회복 제안</h3>
                    {analysisResult.recovery_suggestions.map((s, i) => (
                      <p key={i} className="text-[16px]" style={{ color: 'var(--color-text-secondary)' }}>• {s}</p>
                    ))}
                  </div>
                )}

                {/* Review */}
                <ReviewSection review={review} onSave={updateReview} />

                {/* Achievement */}
                <AchievementTracker totalSchedules={weeklyStats.totalSchedules} completedCount={weeklyStats.totalCompleted} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} apiKey={apiKey} onSaveApiKey={setApiKey} model={model} onSaveModel={setModel} />
      <AdvisorSettings isOpen={showAdvisorSettings} onClose={() => setShowAdvisorSettings(false)} allAdvisors={ALL_ADVISORS} selectedIds={selectedAdvisorIds} onSave={setSelectedAdvisorIds} />
    </div>
  );
}
