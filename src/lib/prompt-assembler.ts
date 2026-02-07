import { ScheduleItem, EnergyLevel, Emotion, AdvisorTone, Advisor, UserProfile } from '@/types/schedule';
import { SYSTEM_PROMPT, OUTPUT_SCHEMA, ADVISOR_POOL } from './prompt-data';

let cachedSystemPrompt: string | null = null;

function getSystemPromptBase(): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;

  cachedSystemPrompt = [
    SYSTEM_PROMPT,
    '\n\n---\n\n## Reference: Advisor Pool\n',
    ADVISOR_POOL,
    '\n\n---\n\n## Output JSON Schema\n',
    '반드시 아래 JSON 스키마에 맞춰 순수 JSON으로만 응답하십시오. 마크다운이나 코드블록으로 감싸지 마십시오.\n\n',
    OUTPUT_SCHEMA,
  ].join('');

  return cachedSystemPrompt;
}

function formatScheduleList(schedules: ScheduleItem[]): string {
  if (schedules.length === 0) return '(일정 없음)';

  const emotionMap: Record<Emotion, string> = {
    excited: '기대',
    nervous: '긴장',
    burdened: '부담',
    normal: '평범',
  };

  const sorted = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return sorted
    .map(
      (s, i) =>
        `${i + 1}. ${s.startTime}~${s.endTime} | ${s.title} | 중요도: ${s.priority} | 카테고리: ${s.category} | 감정: ${emotionMap[s.emotion]}`
    )
    .join('\n');
}

function formatProfile(profile: UserProfile): string {
  const lines: string[] = [];
  if (profile.traits.length > 0) lines.push(`기질: ${profile.traits.join(', ')}`);
  if (profile.medications.length > 0) lines.push(`복용 약물: ${profile.medications.join(', ')}`);
  if (profile.preferences.length > 0) lines.push(`선호 활동: ${profile.preferences.join(', ')}`);
  if (profile.sleepGoal) lines.push(`수면 목표: ${profile.sleepGoal}`);
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

  const energyLabels: Record<EnergyLevel, string> = {
    high: '좋음 (에너지 높음)',
    medium: '보통',
    low: '낮음 (피로)',
  };

  const toneLabels: Record<AdvisorTone, string> = {
    encouraging: '격려 모드 — 동기부여, 긍정적',
    direct: '직설 모드 — 핵심만, 날카롭게',
  };

  const advisorNames = advisors.map((a) => `${a.name} (${a.initials})`).join(', ');

  let userContent = `## 오늘의 일정 분석 요청

### 사용자 프로필
${formatProfile(profile)}

### 에너지 레벨
${energyLabels[energyLevel]}

### 조언자
${advisorNames}
톤: ${toneLabels[advisorTone]}

### 일정 목록
${formatScheduleList(schedules)}
`;

  if (isRestDay) {
    userContent += '\n### 모드\n쉬는 날 모드 — 리커버리 전략을 제안해주세요.\n';
  }

  userContent += '\n### 중요 지시\n- neuro_tips: 일정 사이에 삽입할 뇌과학 기반 회복 활동을 반드시 3개 이상 제안\n- daily_neuro_summary: ADHD/HSP 특성과 약물 복용 시간을 고려한 종합 팁 (3~5문장)\n';

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent },
  ];
}
