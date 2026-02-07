import { AnalysisResult, Priority, Category, TimelineEntry, BriefingEntry, AdvisorComment, NeuroSuggestion } from '@/types/schedule';

export function parseResponse(raw: string): AnalysisResult {
  try {
    const data = JSON.parse(raw);
    return normalizeResult(data);
  } catch {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        return normalizeResult(data);
      } catch {
        // fall through
      }
    }
    return createTextFallback(raw);
  }
}

function asPriority(v: unknown): Priority {
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return 'medium';
}

function asCategory(v: unknown): Category {
  if (v === 'work' || v === 'family' || v === 'personal' || v === 'health') return v;
  return 'work';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeResult(data: any): AnalysisResult {
  const timeline: TimelineEntry[] = Array.isArray(data.timeline)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.timeline.map((t: any, i: number): TimelineEntry => ({
        id: (t.id as number) ?? i,
        start: (t.start as string) || '00:00',
        end: (t.end as string) || '00:00',
        title: (t.title as string) || '',
        priority: asPriority(t.priority),
        category: asCategory(t.category),
        buffer_before: (t.buffer_before as number) ?? 0,
        buffer_after: (t.buffer_after as number) ?? 0,
      }))
    : [];

  const briefings: BriefingEntry[] = Array.isArray(data.briefings)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.briefings.map((b: any, i: number): BriefingEntry => ({
        id: (b.id as number) ?? i,
        title: (b.title as string) || '',
        confidence: (b.confidence as number) ?? 3,
        before: Array.isArray(b.before) ? (b.before as string[]) : [],
        during: Array.isArray(b.during) ? (b.during as string[]) : [],
        after: Array.isArray(b.after) ? (b.after as string[]) : [],
        transition: (b.transition as string) || '',
        emotion_note: (b.emotion_note as string) || '',
        is_family: (b.is_family as boolean) ?? false,
      }))
    : [];

  const advisors: AdvisorComment[] = Array.isArray(data.advisors)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.advisors.map((a: any): AdvisorComment => ({
        name: (a.name as string) || '',
        initials: (a.initials as string) || '',
        comment: (a.comment as string) || '',
        target_schedule: (a.target_schedule as string) || '',
      }))
    : [];

  const neuro_tips: NeuroSuggestion[] = Array.isArray(data.neuro_tips)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.neuro_tips.map((n: any): NeuroSuggestion => ({
        type: n.type || 'rest',
        emoji: (n.emoji as string) || '🧠',
        label: (n.label as string) || '',
        duration: (n.duration as number) ?? 10,
        reason: (n.reason as string) || '',
        insert_after: (n.insert_after as number) ?? 0,
      }))
    : [];

  return {
    timeline,
    briefings,
    advisors,
    overall_tip: (data.overall_tip as string) || '',
    overload_warning: (data.overload_warning as string) || null,
    recovery_suggestions: Array.isArray(data.recovery_suggestions)
      ? (data.recovery_suggestions as string[])
      : [],
    rest_mode_tip: (data.rest_mode_tip as string) || null,
    neuro_tips,
    daily_neuro_summary: (data.daily_neuro_summary as string) || '',
  };
}

function createTextFallback(text: string): AnalysisResult {
  return {
    timeline: [],
    briefings: [{
      id: 0, title: 'AI 분석 결과', confidence: 2,
      before: [text.slice(0, 200)], during: [], after: [],
      transition: '', emotion_note: 'JSON 파싱에 실패하여 텍스트로 표시합니다.', is_family: false,
    }],
    advisors: [],
    overall_tip: '',
    overload_warning: null,
    recovery_suggestions: [],
    rest_mode_tip: null,
    neuro_tips: [],
    daily_neuro_summary: '',
  };
}
