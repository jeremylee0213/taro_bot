'use client';

import { useState, useCallback } from 'react';
import {
  AnalysisResult,
  AnalysisProgress,
  AnalysisView,
  AdvisorTone,
  Advisor,
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
import { EmptyState } from './EmptyState';
import { ScheduleForm } from './ScheduleForm';
import { OverloadBanner } from './OverloadBanner';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { TimelineChart } from './TimelineChart';
import { BriefingCard } from './BriefingCard';
import { AdvisorPanel } from './AdvisorPanel';
import { AdvisorSettings } from './AdvisorSettings';
import { ReviewSection } from './ReviewSection';
import { AchievementTracker } from './AchievementTracker';
import { ShareButton } from './ShareButton';
import { SettingsModal } from './SettingsModal';

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

export function PlannerContainer() {
  // Date
  const [date, setDate] = useState(getToday());

  // Theme
  const [theme, toggleTheme] = useTheme();

  // Settings
  const [apiKey, setApiKey] = useLocalStorage('ceo-planner-apikey', '');
  const [model, setModel] = useLocalStorage('ceo-planner-model', 'gpt-4o');
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useLocalStorage<string[]>(
    'ceo-planner-advisors',
    DEFAULT_ADVISOR_IDS
  );
  const [advisorTone, setAdvisorTone] = useLocalStorage<AdvisorTone>(
    'ceo-planner-tone',
    'encouraging'
  );

  // Schedule store
  const {
    schedules,
    energyLevel,
    review,
    completedCount,
    isLoaded,
    updateSchedules,
    updateEnergyLevel,
    updateReview,
    updateCompletedCount,
    getWeeklyStats,
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

  // Cache
  const { getCached, setCache } = useAnalysisCache();

  // Derived
  const overloadMsg = checkOverload(schedules);
  const recoverySuggestions = findRecoverySuggestions(schedules);
  const energyTip = getEnergyTip(energyLevel, schedules);
  const restDay = isRestDay(schedules);
  const selectedAdvisors = ALL_ADVISORS.filter((a) => selectedAdvisorIds.includes(a.id));
  const weeklyStats = getWeeklyStats();

  // ─── Analysis handler ───
  const runAnalysis = useCallback(
    async (restMode = false) => {
      if (!apiKey) {
        setShowSettings(true);
        return;
      }

      // Check cache
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
        // Step 1: Prepare
        setProgress({ step: 1, total: 3, label: '프롬프트 준비 중...' });
        const messages = assemblePrompt({
          schedules,
          energyLevel,
          advisors: selectedAdvisors,
          advisorTone,
          isRestDay: restMode,
        });

        // Step 2: API call
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
          ...(useNewTokenParam
            ? { max_completion_tokens: 4096 }
            : { max_tokens: 4096 }),
        });

        const raw = response.choices[0]?.message?.content || '';

        // Step 3: Parse
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
        } else if (errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503')) {
          setError('OpenAI 서버에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(`오류가 발생했습니다: ${errMsg}`);
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    [apiKey, model, schedules, energyLevel, selectedAdvisors, selectedAdvisorIds, advisorTone, completedCount, getCached, setCache, updateCompletedCount]
  );

  const handleScrollToBriefing = (id: number) => {
    const el = document.getElementById(`briefing-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!isLoaded) {
    return <div className="min-h-screen bg-bg" />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <DateHeader
        date={date}
        onDateChange={setDate}
        energyLevel={energyLevel}
        onEnergyChange={updateEnergyLevel}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* ─── Form View ─── */}
        {view === 'form' && (
          <>
            {schedules.length === 0 ? (
              <EmptyState
                onAddSchedule={() => {
                  updateSchedules((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(36),
                      startTime: '09:00',
                      endTime: '10:00',
                      title: '',
                      priority: 'medium',
                      category: 'work',
                      emotion: 'normal',
                    },
                  ]);
                }}
                onApplyPreset={() => {
                  // Apply default preset
                  updateSchedules(() => [
                    { id: '1', startTime: '09:00', endTime: '10:00', title: '메일 확인 및 업무 정리', priority: 'medium' as const, category: 'work' as const, emotion: 'normal' as const },
                    { id: '2', startTime: '10:00', endTime: '12:00', title: '핵심 업무 집중', priority: 'high' as const, category: 'work' as const, emotion: 'normal' as const },
                    { id: '3', startTime: '13:00', endTime: '14:00', title: '팀 미팅', priority: 'medium' as const, category: 'work' as const, emotion: 'normal' as const },
                    { id: '4', startTime: '14:00', endTime: '17:00', title: '프로젝트 작업', priority: 'medium' as const, category: 'work' as const, emotion: 'normal' as const },
                  ]);
                }}
              />
            ) : (
              <>
                <ScheduleForm
                  schedules={schedules}
                  onUpdate={updateSchedules}
                  onAnalyze={() => runAnalysis(false)}
                  onRestDay={() => runAnalysis(true)}
                />
                <OverloadBanner
                  overloadMessage={overloadMsg}
                  recoverySuggestions={recoverySuggestions}
                  energyTip={energyTip}
                />
              </>
            )}
          </>
        )}

        {/* ─── Result View ─── */}
        {view === 'result' && (
          <>
            {/* Back button + Share */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setView('form'); setError(null); }}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                ← 일정 수정
              </button>
              {analysisResult && <ShareButton result={analysisResult} />}
            </div>

            {/* Loading */}
            {isAnalyzing && <AnalysisSkeleton progress={progress} />}

            {/* Error */}
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 fade-in">
                <p className="text-sm text-text-primary mb-2">{error}</p>
                <button
                  onClick={() => runAnalysis(false)}
                  className="btn-primary px-3 py-1.5 text-xs rounded-lg"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* Results */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-4 fade-in">
                {/* Overall tip */}
                {analysisResult.overall_tip && (
                  <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
                    <p className="text-sm text-text-primary">
                      💡 {analysisResult.overall_tip}
                    </p>
                  </div>
                )}

                {/* Overload warning from AI */}
                {analysisResult.overload_warning && (
                  <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                    <p className="text-sm text-text-primary">
                      ⚠️ {analysisResult.overload_warning}
                    </p>
                  </div>
                )}

                {/* Recovery suggestions from AI */}
                {analysisResult.recovery_suggestions.length > 0 && (
                  <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 space-y-1">
                    {analysisResult.recovery_suggestions.map((s, i) => (
                      <p key={i} className="text-xs text-text-primary">💚 {s}</p>
                    ))}
                  </div>
                )}

                {/* Rest mode tip */}
                {analysisResult.rest_mode_tip && (
                  <div className="bg-info/10 border border-info/20 rounded-xl px-4 py-3">
                    <p className="text-sm text-text-primary">
                      🛋️ {analysisResult.rest_mode_tip}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <TimelineChart
                  timeline={analysisResult.timeline}
                  onClickEntry={handleScrollToBriefing}
                />

                {/* Briefings */}
                {analysisResult.briefings.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-primary">📋 브리핑</h3>
                    {analysisResult.briefings.map((b, idx) => (
                      <BriefingCard
                        key={b.id}
                        briefing={b}
                        defaultOpen={idx === 0}
                      />
                    ))}
                  </div>
                )}

                {/* Advisors */}
                <AdvisorPanel
                  advisors={analysisResult.advisors}
                  tone={advisorTone}
                  onChangeTone={setAdvisorTone}
                  onChangeAdvisors={() => setShowAdvisorSettings(true)}
                />

                {/* Review */}
                <ReviewSection review={review} onSave={updateReview} />

                {/* Achievement */}
                <AchievementTracker
                  totalSchedules={weeklyStats.totalSchedules}
                  completedCount={weeklyStats.totalCompleted}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Modals ─── */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        onSaveApiKey={setApiKey}
        model={model}
        onSaveModel={setModel}
      />

      <AdvisorSettings
        isOpen={showAdvisorSettings}
        onClose={() => setShowAdvisorSettings(false)}
        allAdvisors={ALL_ADVISORS}
        selectedIds={selectedAdvisorIds}
        onSave={setSelectedAdvisorIds}
      />
    </div>
  );
}
