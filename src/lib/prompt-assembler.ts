import { ScheduleItem, EnergyLevel, AdvisorTone, Advisor, UserProfile, DetailMode } from '@/types/schedule';
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

export interface AssembleParams {
  schedules: ScheduleItem[];
  energyLevel: EnergyLevel;
  advisors: Advisor[];
  advisorTone: AdvisorTone;
  profile: UserProfile;
  detailMode: DetailMode;
  isRestDay?: boolean;
  customAdvisorNames?: string[];
}

export function assemblePrompt(params: AssembleParams): { role: string; content: string }[] {
  const { schedules, energyLevel, advisors, advisorTone, profile, detailMode, isRestDay, customAdvisorNames } = params;

  const systemContent = getSystemPromptBase();

  // Build advisor name list: pool advisors + custom names
  const poolAdvisorNames = advisors.map((a) => `${a.name} (${a.initials})`);
  const allAdvisorNames = [...poolAdvisorNames, ...(customAdvisorNames || [])].slice(0, 3);
  const advisorNamesStr = allAdvisorNames.join(', ');

  const modeLabel = { short: '짧게 (일반)', medium: '중간', long: '길게 (상세)' }[detailMode];

  const specialistInstruction = detailMode === 'long'
    ? `\n\n**전문가 인사이트 (specialist_advice)**: 반드시 다음 5명의 전문가 관점에서 조언을 추가하세요:
1. 🧠 시니어 심리상담가 — 감정 관리, 스트레스 대처
2. 🚗 운전/이동 전문가 — 이동 동선, 안전 운전 팁
3. 💻 개발자/생산성 전문가 — 업무 효율, 집중력
4. 🙏 종교인/영성 전문가 — 마음 챙김, 감사, 내적 평화
5. 🥗 영양사 — 식사 타이밍, 영양, 에너지 관리

각 전문가는 emoji, role, advice 필드를 포함합니다. advice는 오늘 일정에 맞는 구체적 조언 2~3문장.`
    : `\n\n**전문가 인사이트 (specialist_advice)**: 다음 5명의 전문가 관점에서 핵심 한줄 조언을 추가하세요:
1. 🧠 심리상담가 2. 🚗 운전전문가 3. 💻 생산성전문가 4. 🙏 영성전문가 5. 🥗 영양사
각 전문가는 emoji, role, advice(핵심 1문장) 필드를 포함합니다.`;

  const userContent = `## 분석 요청

detail_mode: ${detailMode} (${modeLabel})
프로필: ${formatProfile(profile)}
컨디션: ${energyLevel}
조언자: ${advisorNamesStr} (톤: 상황에 맞게 자동 조절 — 긴급하면 직설, 일상이면 격려)
${isRestDay ? '모드: 쉬는 날\n' : ''}
일정:
${formatScheduleList(schedules)}

**지시**: detail_mode="${detailMode}" 규칙을 정확히 따르세요.${detailMode !== 'short' ? ' energy_chart와 briefings를 반드시 포함하세요.' : ''}${specialistInstruction}`;

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}
