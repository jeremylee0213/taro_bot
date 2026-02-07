'use client';

import { useState, useCallback, useRef } from 'react';
import {
  AnalysisResult,
  AnalysisProgress,
  AnalysisView,
  AdvisorTone,
  Advisor,
  UserProfile,
  ScheduleItem,
  DetailMode,
} from '@/types/schedule';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/hooks/useTheme';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { useAnalysisCache } from '@/hooks/useAnalysisCache';
import { getToday } from '@/lib/schedule-utils';
import { assemblePrompt } from '@/lib/prompt-assembler';
import { parseResponse } from '@/lib/parse-response';
import { createOpenAI } from '@/lib/openai';

import { DateHeader } from './DateHeader';
import { QuickInput } from './QuickInput';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { ScheduleTable } from './ScheduleTable';
import { EnergyChart } from './EnergyChart';
import { ConcertaChart } from './ConcertaChart';
import { AdvisorPanel } from './AdvisorPanel';
import { AdvisorSettings } from './AdvisorSettings';
import { ShareButton } from './ShareButton';
import { SettingsModal } from './SettingsModal';

const DEFAULT_PROFILE: UserProfile = {
  traits: ['조용한 ADHD', 'HSP'],
  medications: ['아토목신 10mg', '아리피졸 2mg', '콘서타 27mg 오전', '콘서타 17mg 오후'],
  preferences: ['러닝', '수면', '독서', '명상', '기록'],
  sleepGoal: '23:00~07:00',
  notes: '',
  concertaDoses: [
    { time: '08:00', doseMg: 27 },
    { time: '13:00', doseMg: 17 },
  ],
};

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

const MODE_LABELS: Record<DetailMode, string> = {
  short: '⚡ 짧게',
  medium: '📊 중간',
  long: '📖 길게',
};

export function PlannerContainer() {
  const [date, setDate] = useState(getToday());
  const [theme, toggleTheme] = useTheme();

  const [apiKey, setApiKey] = useLocalStorage('ceo-planner-apikey', '');
  const [model, setModel] = useLocalStorage('ceo-planner-model', 'gpt-4o');
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useLocalStorage<string[]>('ceo-planner-advisors', DEFAULT_ADVISOR_IDS);
  const [advisorTone, setAdvisorTone] = useLocalStorage<AdvisorTone>('ceo-planner-tone', 'encouraging');
  const [profile, setProfile] = useLocalStorage<UserProfile>('ceo-planner-profile', DEFAULT_PROFILE);
  const [detailMode, setDetailMode] = useLocalStorage<DetailMode>('ceo-planner-detail-mode', 'medium');

  const {
    energyLevel, isLoaded,
    updateSchedules, updateEnergyLevel, updateCompletedCount,
  } = useScheduleStore(date);

  const [view, setView] = useState<AnalysisView>('form');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({ step: 0, total: 3, label: '' });
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [showAdvisorSettings, setShowAdvisorSettings] = useState(false);

  const lastSchedulesRef = useRef<ScheduleItem[]>([]);
  const touchStartX = useRef(0);

  const { setCache } = useAnalysisCache();

  // ─── Streaming Analysis ───
  const runAnalysis = useCallback(
    async (items: ScheduleItem[], advisorIds?: string[]) => {
      if (!apiKey) { setShowSettings(true); return; }

      const restMode = items.length === 0;
      const schedules = items;
      updateSchedules(() => schedules);
      lastSchedulesRef.current = schedules;

      const idsToUse = advisorIds || selectedAdvisorIds;
      const advisorsToUse = ALL_ADVISORS.filter((a) => idsToUse.includes(a.id));

      setIsAnalyzing(true);
      setError(null);
      setStreamText('');
      setView('result');

      try {
        setProgress({ step: 1, total: 3, label: '🔧 프롬프트 준비 중...' });
        const messages = assemblePrompt({
          schedules, energyLevel,
          advisors: advisorsToUse,
          advisorTone,
          profile,
          detailMode,
          isRestDay: restMode,
        });

        setProgress({ step: 2, total: 3, label: '🤖 AI 분석 중...' });
        const openai = createOpenAI(apiKey);

        const useNewTokenParam = [
          'gpt-5.2', 'gpt-4.5-preview', 'gpt-4.1', 'gpt-4.1-mini',
          'o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini',
        ].some((m) => model.startsWith(m));

        const maxTokens = detailMode === 'long' ? 8192 : detailMode === 'medium' ? 6144 : 4096;
        const isReasoningModel = ['o1', 'o3'].some((m) => model.startsWith(m));

        if (isReasoningModel) {
          const response = await openai.chat.completions.create({
            model,
            messages: messages as Parameters<typeof openai.chat.completions.create>[0]['messages'],
            response_format: { type: 'json_object' },
            ...(useNewTokenParam ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
          });
          const raw = response.choices[0]?.message?.content || '';
          setProgress({ step: 3, total: 3, label: '✅ 완료!' });
          const result = parseResponse(raw);
          setAnalysisResult(result);
          setCache(schedules, energyLevel, idsToUse, result);
        } else {
          const stream = await openai.chat.completions.create({
            model,
            messages: messages as Parameters<typeof openai.chat.completions.create>[0]['messages'],
            response_format: { type: 'json_object' },
            stream: true,
            ...(useNewTokenParam ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
          });

          let accumulated = '';
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            accumulated += delta;
            setStreamText(accumulated);
          }

          setProgress({ step: 3, total: 3, label: '✅ 완료!' });
          const result = parseResponse(accumulated);
          setAnalysisResult(result);
          setCache(schedules, energyLevel, idsToUse, result);
        }

        updateCompletedCount(schedules.length);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : '알 수 없는 오류';
        if (errMsg.includes('401') || errMsg.includes('Incorrect API key')) {
          setError('🔑 API 키가 올바르지 않습니다.');
        } else if (errMsg.includes('429')) {
          setError('⏳ 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(`❌ 오류: ${errMsg}`);
        }
      } finally {
        setIsAnalyzing(false);
        setStreamText('');
      }
    },
    [apiKey, model, energyLevel, selectedAdvisorIds, advisorTone, profile, detailMode, setCache, updateCompletedCount, updateSchedules]
  );

  // ─── Advisor change → re-generation ───
  const handleAdvisorChange = useCallback(
    (newIds: string[]) => {
      setSelectedAdvisorIds(newIds);
      setShowAdvisorSettings(false);
      if (lastSchedulesRef.current.length > 0) {
        runAnalysis(lastSchedulesRef.current, newIds);
      }
    },
    [setSelectedAdvisorIds, runAnalysis]
  );

  // ─── Swipe gesture for date change ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 80) {
      const d = new Date(date);
      d.setDate(d.getDate() + (diff > 0 ? -1 : 1));
      const newDate = d.toISOString().split('T')[0];
      setDate(newDate);
    }
  }, [date]);

  const hasEnergy = analysisResult?.energy_chart && analysisResult.energy_chart.length > 0;
  const hasConcerta = profile.concertaDoses && profile.concertaDoses.length > 0;

  if (!isLoaded) return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} />;

  return (
    <div
      className="min-h-screen swipe-container"
      style={{ background: 'var(--color-bg)' }}
      onTouchStart={view === 'result' ? handleTouchStart : undefined}
      onTouchEnd={view === 'result' ? handleTouchEnd : undefined}
    >
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
            <div className="apple-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold" style={{ color: 'var(--color-text)' }}>
                  📊 분석 모드
                </span>
              </div>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as DetailMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDetailMode(mode)}
                    className="flex-1 py-3 rounded-xl text-[16px] font-bold transition-all"
                    style={{
                      background: detailMode === mode ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: detailMode === mode ? '#fff' : 'var(--color-text-secondary)',
                      border: detailMode === mode ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
              <p className="text-[14px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
                {detailMode === 'short' && '⚡ 핵심만 간결하게'}
                {detailMode === 'medium' && '📊 에너지 차트 + 주요 브리핑 포함'}
                {detailMode === 'long' && '📖 전체 브리핑 + 에너지 차트 + 상세 분석'}
              </p>
            </div>
            <QuickInput onAnalyze={runAnalysis} />
          </>
        )}

        {/* ─── RESULT VIEW (Single page scroll) ─── */}
        {view === 'result' && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setView('form'); setError(null); }}
                className="text-[18px] font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                ← 돌아가기
              </button>
              <div className="flex items-center gap-3">
                <span
                  className="text-[14px] px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                >
                  {MODE_LABELS[detailMode]}
                </span>
                {analysisResult && <ShareButton result={analysisResult} />}
              </div>
            </div>

            {!isAnalyzing && (
              <p className="text-center text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                👆 스와이프로 날짜 이동
              </p>
            )}

            {isAnalyzing && <AnalysisSkeleton progress={progress} streamText={streamText || undefined} />}

            {error && (
              <div className="apple-card p-5 fade-in" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                <p className="text-[18px] mb-3" style={{ color: 'var(--color-text)' }}>{error}</p>
                <button onClick={() => runAnalysis(lastSchedulesRef.current)} className="btn-primary px-5 py-2.5">
                  🔄 다시 시도
                </button>
              </div>
            )}

            {/* ─── ALL SECTIONS on single page ─── */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-5 fade-in">
                {/* 1. Overall tip */}
                {analysisResult.overall_tip && (
                  <div className="apple-card p-5" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                    <p className="text-[18px] font-bold leading-relaxed" style={{ color: 'var(--color-text)' }}>
                      💡 {analysisResult.overall_tip}
                    </p>
                  </div>
                )}

                {/* 2. Schedule Table (Timeline + Tips + Briefings merged) */}
                <ScheduleTable
                  timeline={analysisResult.timeline}
                  scheduleTips={analysisResult.schedule_tips}
                  briefings={analysisResult.briefings}
                />

                {/* 3. Concerta Concentration Curve */}
                {hasConcerta && (
                  <ConcertaChart doses={profile.concertaDoses!} />
                )}

                {/* 4. Energy Chart */}
                {hasEnergy && <EnergyChart data={analysisResult.energy_chart!} />}

                {/* 5. Advisor Panel */}
                <AdvisorPanel
                  advisors={analysisResult.advisors}
                  tone={advisorTone}
                  onChangeTone={setAdvisorTone}
                  onChangeAdvisors={() => setShowAdvisorSettings(true)}
                />

                {/* 6. Neuro Summary */}
                {analysisResult.daily_neuro_summary && (
                  <div className="apple-card p-5 fade-in" style={{ borderLeft: '4px solid var(--color-neuro)' }}>
                    <h3 className="text-[20px] font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                      🧠 뇌과학 인사이트
                    </h3>
                    <p className="text-[17px] font-medium mb-3 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                      {analysisResult.daily_neuro_summary}
                    </p>
                    {analysisResult.neuro_tips.length > 0 && (
                      <div className="space-y-2">
                        {analysisResult.neuro_tips.map((tip, i) => (
                          <p key={i} className="text-[16px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            {tip.emoji} <strong>{tip.label}</strong> · {tip.duration}분 — {tip.reason}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        onSaveApiKey={setApiKey}
        model={model}
        onSaveModel={setModel}
        profile={profile}
        onSaveProfile={setProfile}
      />
      <AdvisorSettings
        isOpen={showAdvisorSettings}
        onClose={() => setShowAdvisorSettings(false)}
        allAdvisors={ALL_ADVISORS}
        selectedIds={selectedAdvisorIds}
        onSave={handleAdvisorChange}
      />
    </div>
  );
}
