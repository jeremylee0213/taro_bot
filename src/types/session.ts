export interface CardHistoryEntry {
  card_en: string;
  date: string;
  feedback?: 'positive' | 'neutral' | 'unknown';
  retrospective?: string;
}

export interface GuestHistoryEntry {
  name: string;
  date: string;
}

export interface SessionState {
  session_count: number;
  consecutive_days: number;
  last_session_date: string | null;
  monthly_count: number;
  current_month: string;
  card_history: CardHistoryEntry[];
  guest_history: GuestHistoryEntry[];
  monthly_themes: string[];
  monthly_card_freq: Record<string, number>;
  recent_feedback: string | null;
  preferred_persona: string | null;
}

export type TimePeriod = 'morning' | 'midday' | 'evening';
export type UserStage = 'explorer' | 'adapter' | 'deep';

export interface ContextVariables {
  user_age: number;
  spouse_age: number;
  child_age: number;
  child_name: string;
  time_period: TimePeriod;
  session_count: number;
  consecutive_days: number;
  user_stage: UserStage;
  monthly_count: number;
  recent_cards_7d: string[];
  recent_guests: string[];
  monthly_themes: string[];
  monthly_card_freq: Record<string, number>;
  recent_feedback: string;
  preferred_persona: string;
}

export const DEFAULT_SESSION_STATE: SessionState = {
  session_count: 0,
  consecutive_days: 0,
  last_session_date: null,
  monthly_count: 0,
  current_month: '',
  card_history: [],
  guest_history: [],
  monthly_themes: [],
  monthly_card_freq: {},
  recent_feedback: null,
  preferred_persona: null,
};
