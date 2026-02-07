import { TarotResponse } from './tarot';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  parsed?: TarotResponse;
  imageUrl?: string;
  isOnboarding?: boolean;
  timestamp: number;
}
