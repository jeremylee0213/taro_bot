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
  traits: string[];
  medications: string[];
  preferences: string[];
  sleepGoal: string;
  notes: string;
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
}

export interface ScheduleTip {
  schedule_id: number;
  tips: string[];
}

export interface AdvisorComment {
  name: string;
  initials: string;
  comment: string;
}

export interface NeuroSuggestion {
  emoji: string;
  label: string;
  duration: number;
  reason: string;
}

export interface AnalysisResult {
  timeline: TimelineEntry[];
  schedule_tips: ScheduleTip[];
  advisors: AdvisorComment[];
  overall_tip: string;
  neuro_tips: NeuroSuggestion[];
  daily_neuro_summary: string;
}

// ─── App State Types ───

export interface DayData {
  date: string;
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
