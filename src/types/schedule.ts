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

export interface AnalysisResult {
  timeline: TimelineEntry[];
  briefings: BriefingEntry[];
  advisors: AdvisorComment[];
  overall_tip: string;
  overload_warning: string | null;
  recovery_suggestions: string[];
  rest_mode_tip: string | null;
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
  selectedAdvisors: string[]; // advisor ids
  advisorTone: AdvisorTone;
}
