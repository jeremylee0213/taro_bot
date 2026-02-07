// ─── Schedule Input Types ───

export type Priority = 'high' | 'medium' | 'low';
export type Emotion = 'excited' | 'nervous' | 'burdened' | 'normal';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type Category = 'work' | 'family' | 'personal' | 'health';
export type AdvisorTone = 'encouraging' | 'direct';
export type AnalysisView = 'form' | 'result';

export interface ScheduleItem {
  id: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  title: string;
  priority: Priority;
  category: Category;
  emotion: Emotion;
}

export interface SchedulePreset {
  name: string;
  items: Omit<ScheduleItem, 'id'>[];
}

// ─── Profile Types ───

export interface UserProfile {
  traits: string[];         // e.g. ['조용한 ADHD', 'HSP']
  medications: string[];    // e.g. ['아토목신 10mg', '콘서타 27mg 오전']
  preferences: string[];    // e.g. ['러닝', '명상', '독서']
  sleepGoal: string;        // e.g. '23:00~07:00'
  notes: string;            // free-text
}

// ─── Advisor Types ───

export interface Advisor {
  id: string;
  name: string;
  nameEn: string;
  initials: string;
  description: string;
  style: string;
}

// ─── AI Analysis Output Types ───

export interface TimelineEntry {
  id: number;
  start: string;
  end: string;
  title: string;
  priority: Priority;
  category: Category;
  buffer_before: number;
  buffer_after: number;
}

export interface BriefingEntry {
  id: number;
  title: string;
  confidence: number; // 1-5
  before: string[];
  during: string[];
  after: string[];
  transition: string;
  emotion_note: string;
  is_family: boolean;
}

export interface AdvisorComment {
  name: string;
  initials: string;
  comment: string;
  target_schedule: string;
}

// ─── Neuroscience suggestion from AI ───

export interface NeuroSuggestion {
  type: 'rest' | 'exercise' | 'meditation' | 'reading' | 'journaling' | 'walk' | 'breathe' | 'nap' | 'hydrate';
  emoji: string;
  label: string;
  duration: number; // minutes
  reason: string;
  insert_after: number; // schedule id after which to insert
}

export interface AnalysisResult {
  timeline: TimelineEntry[];
  briefings: BriefingEntry[];
  advisors: AdvisorComment[];
  overall_tip: string;
  overload_warning: string | null;
  recovery_suggestions: string[];
  rest_mode_tip: string | null;
  neuro_tips: NeuroSuggestion[];
  daily_neuro_summary: string;
}

// ─── App State Types ───

export interface DayData {
  date: string; // YYYY-MM-DD
  schedules: ScheduleItem[];
  energyLevel: EnergyLevel;
  review?: string;
  completedCount?: number;
}

export interface AnalysisProgress {
  step: number;
  total: number;
  label: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  selectedAdvisors: string[];
  advisorTone: AdvisorTone;
}
