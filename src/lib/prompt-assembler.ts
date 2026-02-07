import { ScheduleItem, EnergyLevel, AdvisorTone, Advisor, UserProfile } from '@/types/schedule';
import { SYSTEM_PROMPT, OUTPUT_SCHEMA, ADVISOR_POOL } from './prompt-data';

let cachedSystemPrompt: string | null = null;

function getSystemPromptBase(): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;

  cachedSystemPrompt = [
    SYSTEM_PROMPT,
    '\n\n---\n\n## Reference: Advisor Pool\n',
    ADVISOR_POOL,
    '\n\n---\n\n## Output JSON Schema\n',
    'JSON으로만 응답. 코드블록 금지.\n\n',
    OUTPUT_SCHEMA,
  ].join('');

  return cachedSystemPrompt;
}

function formatScheduleList(schedules: ScheduleItem[]): string {
  if (schedules.length === 0) return '(일정 없음)';
  const sorted = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return sorted
    .map((s, i) => `${i + 1}. ${s.startTime}~${s.endTime} ${s.title} [${s.priority}/${s.category}]`)
    .join('\n');
}

function formatProfile(profile: UserProfile): string {
  const lines: string[] = [];
  if (profile.traits.length > 0) lines.push(`기질: ${profile.traits.join(', ')}`);
  if (profile.medications.length > 0) lines.push(`약물: ${profile.medications.join(', ')}`);
  if (profile.preferences.length > 0) lines.push(`선호: ${profile.preferences.join(', ')}`);
  if (profile.sleepGoal) lines.push(`수면: ${profile.sleepGoal}`);
  if (profile.notes) lines.push(`메모: ${profile.notes}`);
  return lines.join('\n');
}

interface AssembleParams {
  schedules: ScheduleItem[];
  energyLevel: EnergyLevel;
  advisors: Advisor[];
  advisorTone: AdvisorTone;
  profile: UserProfile;
  isRestDay?: boolean;
}

export function assemblePrompt(params: AssembleParams): { role: string; content: string }[] {
  const { schedules, energyLevel, advisors, advisorTone, profile, isRestDay } = params;

  const systemContent = getSystemPromptBase();
  const advisorNames = advisors.map((a) => `${a.name} (${a.initials})`).join(', ');

  let userContent = `## 분석 요청

프로필: ${formatProfile(profile)}
컨디션: ${energyLevel}
조언자: ${advisorNames} (${advisorTone === 'encouraging' ? '격려' : '직설'})
${isRestDay ? '모드: 쉬는 날\n' : ''}
일정:
${formatScheduleList(schedules)}

**핵심 지시**: 짧게. 모든 항목 한 줄로. schedule_tips는 꼭 필요한 것만.`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}
