import { AnalysisResult, Priority, Category, TimelineEntry, ScheduleTip, AdvisorComment, NeuroSuggestion, EnergyBlock, BriefingEntry, SpecialistAdvice } from '@/types/schedule';

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
      }))
    : [];

  const schedule_tips: ScheduleTip[] = Array.isArray(data.schedule_tips)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.schedule_tips.map((s: any): ScheduleTip => ({
        schedule_id: (s.schedule_id as number) ?? 0,
        tips: Array.isArray(s.tips) ? (s.tips as string[]) : [],
      }))
    : [];

  const advisors: AdvisorComment[] = Array.isArray(data.advisors)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.advisors.map((a: any): AdvisorComment => ({
        name: (a.name as string) || '',
        initials: (a.initials as string) || '',
        comment: (a.comment as string) || '',
      }))
    : [];

  const neuro_tips: NeuroSuggestion[] = Array.isArray(data.neuro_tips)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.neuro_tips.map((n: any): NeuroSuggestion => ({
        emoji: (n.emoji as string) || '🧠',
        label: (n.label as string) || '',
        duration: (n.duration as number) ?? 10,
        reason: (n.reason as string) || '',
      }))
    : [];

  const energy_chart: EnergyBlock[] | undefined = Array.isArray(data.energy_chart)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.energy_chart.map((e: any): EnergyBlock => ({
        hour: (e.hour as number) ?? 9,
        level: Math.min(10, Math.max(1, (e.level as number) ?? 5)),
        label: (e.label as string) || '',
      }))
    : undefined;

  const briefings: BriefingEntry[] | undefined = Array.isArray(data.briefings)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.briefings.map((b: any): BriefingEntry => ({
        id: (b.id as number) ?? 0,
        title: (b.title as string) || '',
        tip: (b.tip as string) || '',
        prep: Array.isArray(b.prep) ? (b.prep as string[]) : [],
      }))
    : undefined;

  const specialist_advice: SpecialistAdvice[] | undefined = Array.isArray(data.specialist_advice)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? data.specialist_advice.map((s: any): SpecialistAdvice => ({
        emoji: (s.emoji as string) || '💡',
        role: (s.role as string) || '',
        advice: (s.advice as string) || '',
      }))
    : undefined;

  return {
    timeline,
    schedule_tips,
    advisors,
    overall_tip: (data.overall_tip as string) || '',
    neuro_tips,
    daily_neuro_summary: (data.daily_neuro_summary as string) || '',
    energy_chart,
    briefings,
    specialist_advice,
  };
}

function createTextFallback(text: string): AnalysisResult {
  return {
    timeline: [],
    schedule_tips: [],
    advisors: [],
    overall_tip: text.slice(0, 100),
    neuro_tips: [],
    daily_neuro_summary: '',
  };
}
