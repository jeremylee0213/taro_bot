import { ContextVariables } from '@/types/session';
import {
  SYSTEM_PROMPT,
  CONTEXT_TEMPLATE,
  GOLDEN_EXAMPLES,
  OUTPUT_SCHEMA,
  PERSONA_POOL,
  TAROT_DECK,
  EMOJI_DESIGN_SYSTEM,
} from './prompt-data';

let cachedSystemPrompt: string | null = null;

function getSystemPromptBase(): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;

  cachedSystemPrompt = [
    SYSTEM_PROMPT,
    '\n\n---\n\n## Reference: Persona Pool\n',
    PERSONA_POOL,
    '\n\n---\n\n## Reference: Tarot Deck\n',
    TAROT_DECK,
    '\n\n---\n\n## Reference: Emoji Design System\n',
    EMOJI_DESIGN_SYSTEM,
    '\n\n---\n\n## Output Format\n',
    '반드시 아래 JSON 스키마에 맞춰 순수 JSON으로만 응답하십시오. 마크다운이나 코드블록(```)으로 감싸지 마십시오.\n\n',
    OUTPUT_SCHEMA,
  ].join('');

  return cachedSystemPrompt;
}

function fillContextTemplate(context: ContextVariables): string {
  const replacements: Record<string, string> = {
    '{{user_age}}': String(context.user_age),
    '{{spouse_age}}': String(context.spouse_age),
    '{{child_age}}': String(context.child_age),
    '{{child_name}}': context.child_name,
    '{{time_period}}': context.time_period,
    '{{session_count}}': String(context.session_count),
    '{{consecutive_days}}': String(context.consecutive_days),
    '{{user_stage}}': context.user_stage,
    '{{monthly_count}}': String(context.monthly_count),
    '{{recent_cards_7d}}': JSON.stringify(context.recent_cards_7d),
    '{{recent_guests}}': JSON.stringify(context.recent_guests),
    '{{monthly_themes}}': JSON.stringify(context.monthly_themes),
    '{{monthly_card_freq}}': JSON.stringify(context.monthly_card_freq),
    '{{recent_feedback}}': context.recent_feedback,
    '{{preferred_persona}}': context.preferred_persona,
  };

  let filled = CONTEXT_TEMPLATE;
  for (const [key, value] of Object.entries(replacements)) {
    filled = filled.replaceAll(key, value);
  }
  return filled;
}

function selectGoldenExamples(sessionCount: number): string {
  const sections = GOLDEN_EXAMPLES.split(/^## 예시 \d+:/m).filter(Boolean);

  const selected: string[] = [];

  // Example 1 (Quick) - always include for format reference
  if (sections[0]) selected.push('## 예시 1:' + sections[0]);

  // If first session, include onboarding example
  if (sessionCount === 1 && sections[3]) {
    selected.push('## 예시 4:' + sections[3]);
  }
  // Include crisis example for safety
  else if (sections[4]) {
    selected.push('## 예시 5:' + sections[4]);
  }

  return selected.join('\n\n---\n\n');
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function assemblePrompt(
  userMessage: string,
  context: ContextVariables,
  history: ConversationMessage[] = []
): { role: string; content: string }[] {
  const systemBase = getSystemPromptBase();
  const contextFilled = fillContextTemplate(context);
  const examples = selectGoldenExamples(context.session_count);

  const systemContent = [
    systemBase,
    '\n\n---\n\n## Current Session Context\n',
    contextFilled,
    '\n\n---\n\n## Few-shot Examples (참고용)\n',
    examples,
  ].join('');

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemContent },
  ];

  // Add conversation history (capped at 10 turns)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  return messages;
}
