'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/types/chat';
import { TarotResponse } from '@/types/tarot';
import { ContextVariables } from '@/types/session';
import { useSessionState } from '@/hooks/useSessionState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { buildContextVariables } from '@/lib/context-builder';
import { assemblePrompt, ConversationMessage } from '@/lib/prompt-assembler';
import { createOpenAI } from '@/lib/openai';
import { parseResponse } from '@/lib/parse-response';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { LoadingIndicator } from './LoadingIndicator';
import { SettingsModal } from './SettingsModal';

const NEW_TOKEN_MODELS = ['gpt-5.2', 'gpt-4.5-preview', 'gpt-4.1', 'gpt-4.1-mini', 'o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini'];

export function ChatContainer() {
  const { state, updateAfterResponse, saveFeedback } = useSessionState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoadingId, setImageLoadingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage<string>('tarot-mirror-api-key', '');
  const [model, setModel] = useLocalStorage<string>('tarot-mirror-model', 'gpt-4o');
  const scrollRef = useRef<HTMLDivElement>(null);
  const onboardingShown = useRef(false);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Show onboarding on first session
  useEffect(() => {
    if (state.session_count <= 1 && messages.length === 0 && !onboardingShown.current) {
      onboardingShown.current = true;
      setMessages([
        {
          id: uuidv4(),
          role: 'assistant',
          content: '',
          isOnboarding: true,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [state.session_count, messages.length]);

  // Build conversation history for API
  const buildHistory = useCallback((): ConversationMessage[] => {
    return messages
      .filter((m) => !m.isOnboarding)
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.role === 'assistant' && m.parsed
          ? JSON.stringify(m.parsed)
          : m.content,
      }));
  }, [messages]);

  // Generate DALL-E image (client-side direct call)
  const generateImage = useCallback(async (messageId: string, imagePrompt: string) => {
    if (!apiKey) return;

    setImageLoadingId(messageId);
    try {
      const openai = createOpenAI(apiKey);
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const url = response.data?.[0]?.url;
      if (url) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, imageUrl: url } : m
          )
        );
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    } finally {
      setImageLoadingId(null);
    }
  }, [apiKey]);

  // Send message (client-side direct OpenAI call)
  const handleSend = useCallback(async (userInput: string) => {
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const context: ContextVariables = buildContextVariables(state);
      const history = buildHistory();
      const promptMessages = assemblePrompt(userInput, context, history);

      const openai = createOpenAI(apiKey);
      const selectedModel = model || 'gpt-4o';
      const useNewTokenParam = NEW_TOKEN_MODELS.some((m) => selectedModel.startsWith(m));

      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: promptMessages as Parameters<typeof openai.chat.completions.create>[0]['messages'],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        ...(useNewTokenParam
          ? { max_completion_tokens: 4096 }
          : { max_tokens: 4096 }),
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        const errorMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: '오류가 발생했습니다: 응답을 생성하지 못했습니다.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const parsed: TarotResponse = parseResponse(responseText);
      const assistantId = uuidv4();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: JSON.stringify(parsed),
        parsed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update session state
      updateAfterResponse(parsed);

      // Generate DALL-E image for full mode
      if (parsed.mode === 'full' && parsed.image_prompt) {
        generateImage(assistantId, parsed.image_prompt);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `오류가 발생했습니다: ${message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, model, state, buildHistory, updateAfterResponse, generateImage]);

  const handleFeedback = useCallback((feedback: string) => {
    saveFeedback(feedback);
  }, [saveFeedback]);

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <h1 className="text-sm font-bold text-accent-gold">Daily Tarot Mirror</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-text-muted">
              {state.session_count > 0 && `${state.session_count}회차`}
              {state.consecutive_days > 1 && ` · ${state.consecutive_days}일 연속`}
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-lg hover:opacity-80 transition-opacity"
              title="설정"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* API Key missing banner */}
      {!apiKey && (
        <div className="bg-accent-gold/10 border-b border-accent-gold/30 px-4 py-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs text-accent-gold hover:underline"
          >
            OpenAI API 키를 설정해주세요 →
          </button>
        </div>
      )}

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onFeedback={handleFeedback}
            imageLoading={imageLoadingId === msg.id}
          />
        ))}
        {isLoading && <LoadingIndicator />}
      </main>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={setApiKey}
        model={model}
        onSaveModel={setModel}
      />
    </div>
  );
}
