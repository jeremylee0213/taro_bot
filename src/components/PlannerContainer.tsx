'use client';

import { useState, useCallback, useRef } from 'react';
import {
  AnalysisResult,
  AnalysisProgress,
  AnalysisView,
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

function formatShareText(date: string, result: AnalysisResult): string {
  const lines = [
    `📅 ${date} Daily CEO Planner`,
    '',
    `💡 오늘의 핵심`,
    result.overall_tip,
    '',
    '📅 일정:',
    ...result.timeline.map((t, i) => `  ${i + 1}. ${t.start}~${t.end} ${t.title}`),
    '',
    '💬 조언:',
    ...result.advisors.map(a => `  ${a.name}: "${a.comment}"`),
    '',
  ];
  if (result.specialist_advice && result.specialist_advice.length > 0) {
    lines.push('🏥 전문가 인사이트:');
    result.specialist_advice.forEach(s => {
      lines.push(`  ${s.emoji} ${s.role}: ${s.advice}`);
    });
    lines.push('');
  }
  if (result.daily_neuro_summary) {
    lines.push(`🧠 ${result.daily_neuro_summary}`);
  }
  return lines.join('\n');
}

export function PlannerContainer() {
  const [date, setDate] = useState(getToday());
  const [theme, toggleTheme] = useTheme();

  const [apiKey, setApiKey] = useLocalStorage('ceo-planner-apikey', '');
  const [model, setModel] = useLocalStorage('ceo-planner-model', 'gpt-4o');
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useLocalStorage<string[]>('ceo-planner-advisors', DEFAULT_ADVISOR_IDS);
  const [customAdvisorNames, setCustomAdvisorNames] = useLocalStorage<string[]>('ceo-planner-custom-advisors', []);
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
          advisorTone: 'encouraging',
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
    [apiKey, model, energyLevel, selectedAdvisorIds, customAdvisorNames, profile, detailMode, setCache, updateCompletedCount, updateSchedules]
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
    const text = formatShareText(date, analysisResult);
    try { await navigator.clipboard.writeText(text); } catch {}
    setSavedMsg('📋 복사됨!');
    setTimeout(() => setSavedMsg(''), 2000);
  }, [analysisResult, date]);

  const handleShare = useCallback(async () => {
    if (!analysisResult) return;
    const text = formatShareText(date, analysisResult);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `📅 ${date} Daily CEO Planner`,
          text,
        });
        return;
      } catch {
        // user cancelled or not supported — fall through
      }
    }

    // Fallback: copy to clipboard
    try { await navigator.clipboard.writeText(text); } catch {}
    setSavedMsg('📋 공유 텍스트 복사됨! 카카오톡/이메일에 붙여넣기하세요');
    setTimeout(() => setSavedMsg(''), 3000);
  }, [analysisResult, date]);

  const handleSaveImage = useCallback(async () => {
    if (!resultRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#ffffff',
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
        backgroundColor: '#ffffff',
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
      <a href="#main-content" className="skip-link">본문으로 건너뛰기</a>
      <DateHeader
        date={date}
        onDateChange={setDate}
        energyLevel={energyLevel}
        onEnergyChange={updateEnergyLevel}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main id="main-content" className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* ─── FORM VIEW ─── */}
        {view === 'form' && (
          <>
            <div className="apple-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] sm:text-[19px] font-bold" style={{ color: 'var(--color-text)' }}>
                  📊 분석 모드
                </span>
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-[14px] font-semibold px-4 py-2.5 rounded-xl focus-ring"
                  style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
                  aria-label="저장된 기록 열기"
                >
                  📚 기록
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="분석 모드 선택">
                {(['short', 'medium'] as DetailMode[]).map((mode) => {
                  const isActive = mode === 'short' ? detailMode === 'short' : detailMode !== 'short';
                  return (
                    <button
                      key={mode}
                      onClick={() => setDetailMode(mode)}
                      className="py-3.5 rounded-xl text-[16px] sm:text-[17px] font-bold transition-all focus-ring"
                      style={{
                        background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: isActive ? '#fff' : 'var(--color-text-secondary)',
                        border: isActive ? 'none' : '1px solid var(--color-border)',
                      }}
                      role="radio"
                      aria-checked={isActive}
                      aria-label={mode === 'short' ? '일반 모드: 핵심 조언만 간결하게' : '상세 모드: 전문가별 상세 조언'}
                    >
                      {mode === 'short' ? '📌 일반' : '📖 상세'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] sm:text-[14px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
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
            <nav className="flex items-center justify-between" aria-label="결과 네비게이션">
              <button
                onClick={() => { setView('form'); setError(null); }}
                className="text-[17px] sm:text-[18px] font-bold px-3 py-2.5 rounded-xl focus-ring"
                style={{ color: 'var(--color-accent)' }}
                aria-label="일정 입력으로 돌아가기"
              >
                ← 돌아가기
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[16px] font-semibold focus-ring"
                  style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
                  aria-label="저장된 기록 열기"
                >
                  📚
                </button>
              </div>
            </nav>

            {isAnalyzing && <AnalysisSkeleton progress={progress} streamText={streamText || undefined} />}

            {error && (
              <div className="apple-card p-5 fade-in" style={{ borderLeft: '4px solid var(--color-danger)' }} role="alert">
                <p className="text-[17px] sm:text-[18px] mb-3" style={{ color: 'var(--color-text)' }}>{error}</p>
                <button
                  onClick={() => runAnalysis(lastSchedulesRef.current)}
                  className="btn-primary px-5 py-3 focus-ring"
                  aria-label="분석 다시 시도"
                >
                  🔄 다시 시도
                </button>
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div ref={resultRef} className="space-y-5 fade-in">

                {/* ─── 1. OVERALL TIP — Primary card, highest visual weight ─── */}
                {analysisResult.overall_tip && (
                  <div
                    className="apple-card p-6 sm:p-8"
                    style={{
                      borderLeft: '6px solid var(--color-accent)',
                      background: 'linear-gradient(135deg, var(--color-accent-light), var(--color-card))',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                    role="region"
                    aria-label="오늘의 핵심 전략"
                  >
                    <p className="text-[13px] sm:text-[14px] font-bold mb-3 tracking-wide" style={{ color: 'var(--color-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      💡 오늘의 핵심
                    </p>
                    <p
                      className="text-[20px] sm:text-[26px] font-bold whitespace-pre-line"
                      style={{ color: 'var(--color-text)', lineHeight: '1.6' }}
                    >
                      {analysisResult.overall_tip.replace(/([.!?])\s+/g, '$1\n')}
                    </p>
                  </div>
                )}

                {/* ─── 2. Schedule + Tips Table ─── */}
                <ScheduleTable
                  timeline={analysisResult.timeline}
                  scheduleTips={analysisResult.schedule_tips}
                  briefings={analysisResult.briefings}
                />

                {/* ─── 3. Concerta + Energy ─── */}
                {hasConcerta && (
                  <ConcertaChart
                    doses={profile.concertaDoses!}
                    energyData={analysisResult.energy_chart}
                  />
                )}

                {/* ─── 4. Advisor Panel ─── */}
                <AdvisorPanel
                  advisors={analysisResult.advisors}
                  onChangeAdvisors={() => setShowAdvisorSettings(true)}
                />

                {/* ─── 5. Specialist Advice — secondary visual weight ─── */}
                {analysisResult.specialist_advice && analysisResult.specialist_advice.length > 0 && (
                  <div className="apple-card p-4 sm:p-6 fade-in" style={{ boxShadow: 'var(--shadow-sm)' }} role="region" aria-label="전문가 인사이트">
                    <h3 className="text-[17px] sm:text-[19px] font-bold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      🏥 전문가 인사이트
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisResult.specialist_advice.map((spec, i) => (
                        <div
                          key={i}
                          className="rounded-xl p-3.5"
                          style={{
                            background: 'var(--color-surface)',
                            borderLeft: '3px solid var(--color-border)',
                          }}
                        >
                          <p className="text-[14px] sm:text-[15px] font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>
                            {spec.emoji} {spec.role}
                          </p>
                          <p
                            className="text-[13px] sm:text-[14px] leading-[1.7] whitespace-pre-line"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {spec.advice.replace(/([.!?])\s+/g, '$1\n')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── 6. Neuro ─── */}
                {analysisResult.daily_neuro_summary && (
                  <div className="apple-card p-4 sm:p-6 fade-in" style={{ borderLeft: '4px solid var(--color-neuro)' }}>
                    <h3 className="text-[20px] sm:text-[22px] font-bold mb-3" style={{ color: 'var(--color-text)' }}>
                      🧠 뇌과학 인사이트
                    </h3>
                    <p
                      className="text-[16px] sm:text-[17px] font-medium mb-4 whitespace-pre-line"
                      style={{ color: 'var(--color-text)', lineHeight: '1.7' }}
                    >
                      {analysisResult.daily_neuro_summary.replace(/([.!?])\s+/g, '$1\n')}
                    </p>
                    {analysisResult.neuro_tips.length > 0 && (
                      <div className="space-y-3">
                        {analysisResult.neuro_tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[18px] flex-shrink-0 mt-0.5">{tip.emoji}</span>
                            <div>
                              <p className="text-[15px] sm:text-[16px] font-bold" style={{ color: 'var(--color-text)' }}>
                                {tip.label} · {tip.duration}분
                              </p>
                              <p className="text-[14px] sm:text-[15px] leading-relaxed mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                {tip.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Action Buttons — min 44px height ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="toolbar" aria-label="결과 액션">
                  <button onClick={handleSaveAdvice} className="py-3.5 rounded-xl text-[14px] sm:text-[15px] font-bold focus-ring"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                    aria-label="분석 결과 저장">
                    💾 저장
                  </button>
                  <button onClick={handleCopyAll} className="py-3.5 rounded-xl text-[14px] sm:text-[15px] font-bold focus-ring"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-accent)', border: '1.5px solid var(--color-accent)' }}
                    aria-label="전체 텍스트 복사">
                    📋 복사
                  </button>
                  <button onClick={handleSaveImage} className="py-3.5 rounded-xl text-[14px] sm:text-[15px] font-bold focus-ring"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-border)' }}
                    aria-label="전체 결과 이미지로 저장">
                    📸 전체 이미지
                  </button>
                  <button onClick={handleShare} className="py-3.5 rounded-xl text-[14px] sm:text-[15px] font-bold focus-ring"
                    style={{ background: 'var(--color-success)', color: '#fff' }}
                    aria-label="결과 공유하기">
                    📤 공유하기
                  </button>
                </div>
                {savedMsg && (
                  <p className="text-center text-[14px] sm:text-[15px] font-semibold fade-in" role="status" style={{ color: 'var(--color-success)' }}>
                    {savedMsg}
                  </p>
                )}

                {/* ─── Summary Card ─── */}
                <div
                  id="summary-card"
                  className="apple-card p-5 sm:p-7 fade-in"
                  style={{ background: 'linear-gradient(135deg, var(--color-card), var(--color-accent-light))' }}
                >
                  <p className="text-[12px] sm:text-[13px] font-bold mb-1 tracking-wide" style={{ color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                    📅 {date}
                  </p>
                  <p className="text-[18px] sm:text-[20px] font-bold mb-5 whitespace-pre-line" style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                    💡 {analysisResult.overall_tip}
                  </p>

                  {/* Mini schedule */}
                  <div className="space-y-1.5 mb-5" style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: '12px' }}>
                    {analysisResult.timeline.slice(0, 6).map((t, i) => (
                      <p key={t.id} className="text-[13px] sm:text-[14px]" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="font-bold" style={{ color: 'var(--color-text)' }}>{i + 1}.</span>{' '}
                        🕐 {t.start}~{t.end}{' '}
                        <strong>{t.title}</strong>
                      </p>
                    ))}
                  </div>

                  {/* Top 3 advisor quotes */}
                  <div className="space-y-2">
                    {analysisResult.advisors.slice(0, 3).map((a, i) => (
                      <p key={i} className="text-[13px] sm:text-[14px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        💬 <strong>{a.name}</strong>: {a.comment.length > 60 ? a.comment.slice(0, 60) + '...' : a.comment}
                      </p>
                    ))}
                  </div>

                  <p className="text-[11px] mt-5 text-right" style={{ color: 'var(--color-text-muted)' }}>
                    Daily CEO Planner
                  </p>
                </div>

                <button
                  onClick={handleSaveSummaryImage}
                  className="w-full py-3.5 rounded-xl text-[15px] sm:text-[16px] font-bold focus-ring"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                  aria-label="핵심 카드 이미지로 저장"
                >
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
