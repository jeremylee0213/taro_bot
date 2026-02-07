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
import { ConcertaChart } from './ConcertaChart';
import { AdvisorPanel } from './AdvisorPanel';
import { AdvisorSettings } from './AdvisorSettings';
import { ShareButton } from './ShareButton';
import { SettingsModal } from './SettingsModal';
import { SavedHistoryPanel, saveAdvice } from './SavedHistoryPanel';

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
  short: '📌 일반',
  medium: '📖 상세',
  long: '📖 상세',
};

export function PlannerContainer() {
  const [date, setDate] = useState(getToday());
  const [theme, toggleTheme] = useTheme();

  const [apiKey, setApiKey] = useLocalStorage('ceo-planner-apikey', '');
  const [model, setModel] = useLocalStorage('ceo-planner-model', 'gpt-4o');
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useLocalStorage<string[]>('ceo-planner-advisors', DEFAULT_ADVISOR_IDS);
  const [customAdvisorNames, setCustomAdvisorNames] = useLocalStorage<string[]>('ceo-planner-custom-advisors', []);
  const [advisorTone, setAdvisorTone] = useLocalStorage<AdvisorTone>('ceo-planner-tone', 'encouraging');
  const [profile, setProfile] = useLocalStorage<UserProfile>('ceo-planner-profile', DEFAULT_PROFILE);
  const [detailMode, setDetailMode] = useLocalStorage<DetailMode>('ceo-planner-detail-mode', 'short');

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
  const [savedMsg, setSavedMsg] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [showAdvisorSettings, setShowAdvisorSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const lastSchedulesRef = useRef<ScheduleItem[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const { setCache } = useAnalysisCache();

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
          detailMode: detailMode === 'short' ? 'short' : 'long',
          isRestDay: restMode,
          customAdvisorNames,
        });

        setProgress({ step: 2, total: 3, label: '🤖 AI 분석 중...' });
        const openai = createOpenAI(apiKey);

        const useNewTokenParam = [
          'gpt-5.2', 'gpt-4.5-preview', 'gpt-4.1', 'gpt-4.1-mini',
          'o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini',
        ].some((m) => model.startsWith(m));

        const maxTokens = detailMode === 'short' ? 4096 : 8192;
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
    [apiKey, model, energyLevel, selectedAdvisorIds, customAdvisorNames, advisorTone, profile, detailMode, setCache, updateCompletedCount, updateSchedules]
  );

  const handleAdvisorChange = useCallback(
    (newIds: string[], newCustomNames?: string[]) => {
      setSelectedAdvisorIds(newIds);
      if (newCustomNames) setCustomAdvisorNames(newCustomNames);
      setShowAdvisorSettings(false);
      if (lastSchedulesRef.current.length > 0) {
        runAnalysis(lastSchedulesRef.current, newIds);
      }
    },
    [setSelectedAdvisorIds, setCustomAdvisorNames, runAnalysis]
  );

  const handleSaveAdvice = useCallback(() => {
    if (!analysisResult) return;
    saveAdvice({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      overallTip: analysisResult.overall_tip || '',
      advisors: analysisResult.advisors.map(a => ({ name: a.name, comment: a.comment })),
      neuroSummary: analysisResult.daily_neuro_summary,
      timestamp: Date.now(),
    });
    setSavedMsg('✅ 저장됨!');
    setTimeout(() => setSavedMsg(''), 2000);
  }, [analysisResult, date]);

  const handleCopyAll = useCallback(async () => {
    if (!analysisResult) return;
    const lines = [
      `📅 ${date} Daily CEO Planner`,
      '',
      `💡 ${analysisResult.overall_tip}`,
      '',
      '📅 일정:',
      ...analysisResult.timeline.map(t => `  ${t.start}~${t.end} ${t.title}`),
      '',
      '💬 조언:',
      ...analysisResult.advisors.map(a => `  ${a.name}: "${a.comment}"`),
      '',
      analysisResult.daily_neuro_summary ? `🧠 ${analysisResult.daily_neuro_summary}` : '',
    ].join('\n');
    try { await navigator.clipboard.writeText(lines); } catch {}
    setSavedMsg('📋 복사됨!');
    setTimeout(() => setSavedMsg(''), 2000);
  }, [analysisResult, date]);

  const handleSaveImage = useCallback(async () => {
    if (!resultRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `ceo-planner-${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      setSavedMsg('❌ 이미지 저장 실패');
      setTimeout(() => setSavedMsg(''), 2000);
    }
  }, [date]);

  const handleSaveSummaryImage = useCallback(async () => {
    const summaryEl = document.getElementById('summary-card');
    if (!summaryEl) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(summaryEl, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `ceo-summary-${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      setSavedMsg('❌ 이미지 저장 실패');
      setTimeout(() => setSavedMsg(''), 2000);
    }
  }, [date]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 80) {
      const d = new Date(date);
      d.setDate(d.getDate() + (diff > 0 ? -1 : 1));
      setDate(d.toISOString().split('T')[0]);
    }
  }, [date]);

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
                <span className="text-[17px] font-bold" style={{ color: 'var(--color-text)' }}>📊 분석 모드</span>
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-[14px] font-semibold px-3 py-1.5 rounded-xl"
                  style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
                >
                  📚 기록
                </button>
              </div>
              <div className="flex gap-3">
                {(['short', 'medium'] as DetailMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDetailMode(mode)}
                    className="flex-1 py-3.5 rounded-xl text-[17px] font-bold transition-all"
                    style={{
                      background: (mode === 'short' ? detailMode === 'short' : detailMode !== 'short') ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: (mode === 'short' ? detailMode === 'short' : detailMode !== 'short') ? '#fff' : 'var(--color-text-secondary)',
                      border: (mode === 'short' ? detailMode === 'short' : detailMode !== 'short') ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    {mode === 'short' ? '📌 일반' : '📖 상세'}
                  </button>
                ))}
              </div>
              <p className="text-[14px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
                {detailMode === 'short'
                  ? '⚡ 핵심 조언만 간결하게'
                  : '📖 전문가별 상세 조언 + 에너지 차트 + 브리핑'}
              </p>
            </div>
            <QuickInput onAnalyze={runAnalysis} />
          </>
        )}

        {/* ─── RESULT VIEW ─── */}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-[14px] font-semibold px-2.5 py-1.5 rounded-xl"
                  style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
                >
                  📚
                </button>
                {analysisResult && <ShareButton result={analysisResult} />}
              </div>
            </div>

            {isAnalyzing && <AnalysisSkeleton progress={progress} streamText={streamText || undefined} />}

            {error && (
              <div className="apple-card p-5 fade-in" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                <p className="text-[18px] mb-3" style={{ color: 'var(--color-text)' }}>{error}</p>
                <button onClick={() => runAnalysis(lastSchedulesRef.current)} className="btn-primary px-5 py-2.5">
                  🔄 다시 시도
                </button>
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div ref={resultRef} className="space-y-5 fade-in">

                {/* ─── 1. OVERALL TIP — enhanced visual ─── */}
                {analysisResult.overall_tip && (
                  <div className="apple-card p-6" style={{ borderLeft: '5px solid var(--color-accent)', background: 'linear-gradient(135deg, var(--color-accent-light), var(--color-card))' }}>
                    <p className="text-[13px] font-bold mb-2" style={{ color: 'var(--color-accent)' }}>
                      💡 오늘의 핵심
                    </p>
                    <p className="text-[20px] font-bold leading-relaxed" style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                      {analysisResult.overall_tip}
                    </p>
                  </div>
                )}

                {/* ─── 2. Schedule Table ─── */}
                <ScheduleTable
                  timeline={analysisResult.timeline}
                  scheduleTips={analysisResult.schedule_tips}
                  briefings={analysisResult.briefings}
                />

                {/* ─── 3. Concerta + Energy combined chart ─── */}
                {hasConcerta && (
                  <ConcertaChart
                    doses={profile.concertaDoses!}
                    energyData={analysisResult.energy_chart}
                  />
                )}

                {/* ─── 4. Expert Advisors ─── */}
                <AdvisorPanel
                  advisors={analysisResult.advisors}
                  tone={advisorTone}
                  onChangeTone={setAdvisorTone}
                  onChangeAdvisors={() => setShowAdvisorSettings(true)}
                />

                {/* ─── 5. Expert Specialists (상세 mode — from AI) ─── */}
                {analysisResult.specialist_advice && analysisResult.specialist_advice.length > 0 && (
                  <div className="apple-card p-5 fade-in">
                    <h3 className="text-[20px] font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                      🏥 전문가 인사이트
                    </h3>
                    <div className="space-y-3">
                      {analysisResult.specialist_advice.map((spec, i) => (
                        <div key={i} className="rounded-xl p-4" style={{ background: 'var(--color-surface)', borderLeft: `4px solid var(--color-accent)` }}>
                          <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                            {spec.emoji} {spec.role}
                          </p>
                          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            {spec.advice}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── 6. Neuro ─── */}
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

                {/* ─── Action buttons: Save / Copy / Image ─── */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleSaveAdvice} className="flex-1 py-3 rounded-xl text-[15px] font-bold"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}>
                    💾 저장
                  </button>
                  <button onClick={handleCopyAll} className="flex-1 py-3 rounded-xl text-[15px] font-bold"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-accent)', border: '1.5px solid var(--color-accent)' }}>
                    📋 복사
                  </button>
                  <button onClick={handleSaveImage} className="flex-1 py-3 rounded-xl text-[15px] font-bold"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-border)' }}>
                    📸 전체 이미지
                  </button>
                </div>
                {savedMsg && (
                  <p className="text-center text-[15px] font-semibold fade-in" style={{ color: 'var(--color-success)' }}>
                    {savedMsg}
                  </p>
                )}

                {/* ─── 7. Summary Card (for image export) ─── */}
                <div id="summary-card" className="apple-card p-6 fade-in" style={{ background: 'linear-gradient(135deg, var(--color-card), var(--color-accent-light))' }}>
                  <p className="text-[13px] font-bold mb-1" style={{ color: 'var(--color-accent)' }}>📅 {date}</p>
                  <p className="text-[20px] font-bold mb-4 leading-relaxed" style={{ color: 'var(--color-text)' }}>
                    💡 {analysisResult.overall_tip}
                  </p>

                  {/* Mini schedule */}
                  <div className="space-y-1 mb-4">
                    {analysisResult.timeline.slice(0, 6).map((t) => (
                      <p key={t.id} className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                        🕐 {t.start}~{t.end} <strong>{t.title}</strong>
                      </p>
                    ))}
                  </div>

                  {/* Top 3 advisor quotes */}
                  <div className="space-y-2">
                    {analysisResult.advisors.slice(0, 3).map((a, i) => (
                      <p key={i} className="text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                        💬 <strong>{a.name}</strong>: {a.comment.length > 50 ? a.comment.slice(0, 50) + '...' : a.comment}
                      </p>
                    ))}
                  </div>

                  <p className="text-[11px] mt-4 text-right" style={{ color: 'var(--color-text-muted)' }}>
                    Daily CEO Planner
                  </p>
                </div>

                <button onClick={handleSaveSummaryImage} className="w-full py-3 rounded-xl text-[16px] font-bold"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}>
                  📸 핵심 카드 이미지 저장
                </button>
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
      <SavedHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
