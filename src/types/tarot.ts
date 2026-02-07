export type OutputMode = 'quick' | 'standard' | 'full';
export type GuideType = 'timeline' | 'perspectives' | 'emotion_journey' | 'pros_cons';
export type InputType = 'schedule' | 'concern' | 'emotion' | 'decision' | 'greeting';
export type RelationType = 'agree' | 'counter' | 'extend' | 'independent';

export interface TarotCard {
  name_kr: string;
  name_en: string;
  number: number;
  reversed: boolean;
  emoji_art: string;
  core_keywords: [string, string, string];
}

export interface TimelineItem {
  period: string;
  time?: string;
  icon: string;
  advice: string;
  energy?: 'high' | 'medium' | 'rest';
  is_family_time?: boolean;
}

export interface PerspectiveItem {
  label: string;
  viewpoint: string;
}

export interface EmotionJourney {
  current: string;
  transition: string;
  evening: string;
}

export interface ProsConsItem {
  option: string;
  pros: string[];
  cons: string[];
}

export type GuideContent = TimelineItem[] | PerspectiveItem[] | EmotionJourney | ProsConsItem[];

export interface Guide {
  type: GuideType;
  title?: string;
  content: GuideContent;
}

export interface RoundtableMember {
  persona: string;
  archetype: string;
  emoji: string;
  quote: string;
  key_point: string;
  relation_to_prev?: RelationType;
}

export interface Compass {
  insight: string;
  question: string;
}

export interface CardDeepReading {
  upright: string;
  reversed: string;
  contextual: string;
}

export interface ResponseMeta {
  card_selection_reason: string;
  emotional_level: 1 | 2 | 3;
  input_type: InputType;
  dependency_alert: boolean;
}

export interface TarotResponse {
  mode: OutputMode;
  card: TarotCard;
  one_liner: string;
  keywords: string[];
  guide?: Guide;
  roundtable?: RoundtableMember[];
  compass?: Compass;
  card_deep_reading?: CardDeepReading;
  image_prompt?: string;
  meta?: ResponseMeta;
}
