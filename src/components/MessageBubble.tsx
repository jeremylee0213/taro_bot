'use client';

import { ChatMessage } from '@/types/chat';
import { CardDisplay } from './CardDisplay';
import { GuideSection } from './GuideSection';
import { RoundtableSection } from './RoundtableSection';
import { CompassSection } from './CompassSection';
import { DeepReadingSection } from './DeepReadingSection';
import { DalleImage } from './DalleImage';
import { FeedbackButtons } from './FeedbackButtons';
import { OnboardingMessage } from './OnboardingMessage';

interface MessageBubbleProps {
  message: ChatMessage;
  onFeedback?: (feedback: string) => void;
  imageLoading?: boolean;
}

export function MessageBubble({ message, onFeedback, imageLoading }: MessageBubbleProps) {
  // Onboarding
  if (message.isOnboarding) {
    return <OnboardingMessage />;
  }

  // User message
  if (message.role === 'user') {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[85%] bg-accent-purple/20 rounded-2xl rounded-br-md px-4 py-3">
          <p className="text-sm text-text-primary whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message without parsed data (error or plain text)
  if (!message.parsed) {
    return (
      <div className="px-4 py-2">
        <div className="bg-card rounded-xl p-4">
          <p className="text-sm text-text-primary whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message with structured TarotResponse
  const { parsed, imageUrl } = message;

  return (
    <div className="px-4 py-2 space-y-3">
      {/* DALL-E Image (Full mode) */}
      {parsed.mode === 'full' && (
        <DalleImage
          imageUrl={imageUrl}
          cardName={parsed.card.name_en}
          emojiArt={parsed.card.emoji_art}
          isLoading={imageLoading}
        />
      )}

      {/* Card Display */}
      <CardDisplay
        card={parsed.card}
        oneLiner={parsed.one_liner}
        keywords={parsed.keywords}
      />

      {/* Deep Reading (Full mode) */}
      {parsed.card_deep_reading && (
        <DeepReadingSection reading={parsed.card_deep_reading} />
      )}

      {/* Guide Section */}
      {parsed.guide && <GuideSection guide={parsed.guide} />}

      {/* Roundtable */}
      {parsed.roundtable && parsed.roundtable.length > 0 && (
        <RoundtableSection members={parsed.roundtable} />
      )}

      {/* Compass */}
      {parsed.compass && <CompassSection compass={parsed.compass} />}

      {/* Feedback (Full mode) */}
      {parsed.mode === 'full' && onFeedback && (
        <FeedbackButtons onFeedback={onFeedback} />
      )}

      {/* Upgrade prompt (Quick/Standard mode) */}
      {parsed.mode !== 'full' && (
        <p className="text-xs text-text-muted text-center py-1">
          &quot;상세&quot; 또는 &quot;풀버전&quot;이라고 하시면 더 깊이 들어갑니다.
        </p>
      )}
    </div>
  );
}
