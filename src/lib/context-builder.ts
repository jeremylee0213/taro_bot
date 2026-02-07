import { SessionState, ContextVariables } from '@/types/session';
import { calculateAge, getTimePeriod, getUserStage, isWithinDays } from './time-utils';

export function buildContextVariables(state: SessionState): ContextVariables {
  const recentCards = state.card_history
    .filter((c) => isWithinDays(c.date, 7))
    .map((c) => c.card_en);

  const recentGuests = state.guest_history
    .slice(-5)
    .map((g) => g.name);

  return {
    user_age: calculateAge('1986-02-13'),
    spouse_age: calculateAge('1988-01-19'),
    child_age: calculateAge('2020-11-06'),
    child_name: '서진',
    time_period: getTimePeriod(),
    session_count: state.session_count,
    consecutive_days: state.consecutive_days,
    user_stage: getUserStage(state.session_count),
    monthly_count: state.monthly_count,
    recent_cards_7d: recentCards,
    recent_guests: recentGuests,
    monthly_themes: state.monthly_themes,
    monthly_card_freq: state.monthly_card_freq,
    recent_feedback: state.recent_feedback || '없음',
    preferred_persona: state.preferred_persona || '없음',
  };
}
