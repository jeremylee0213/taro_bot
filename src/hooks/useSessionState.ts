'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { SessionState, DEFAULT_SESSION_STATE } from '@/types/session';
import { TarotResponse } from '@/types/tarot';
import { formatDate, getCurrentMonth } from '@/lib/time-utils';

const STORAGE_KEY = 'tarot-mirror-state';

export function useSessionState() {
  const [state, setState] = useLocalStorage<SessionState>(STORAGE_KEY, DEFAULT_SESSION_STATE);
  const initialized = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const today = formatDate();
    const currentMonth = getCurrentMonth();

    setState((prev) => {
      const updated = { ...prev };

      // Monthly reset
      if (updated.current_month !== currentMonth) {
        updated.current_month = currentMonth;
        updated.monthly_count = 0;
        updated.monthly_themes = [];
        updated.monthly_card_freq = {};
      }

      // Session counting
      if (updated.last_session_date === today) {
        // Same day continuation - don't increment
        return updated;
      }

      // Check if yesterday
      if (updated.last_session_date) {
        const last = new Date(updated.last_session_date);
        const diff = Math.floor((new Date(today).getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          updated.consecutive_days += 1;
        } else {
          updated.consecutive_days = 1;
        }
      } else {
        updated.consecutive_days = 1;
      }

      updated.session_count += 1;
      updated.monthly_count += 1;
      updated.last_session_date = today;

      return updated;
    });
  }, [setState]);

  // Update state after receiving a response
  const updateAfterResponse = useCallback(
    (response: TarotResponse) => {
      setState((prev) => {
        const updated = { ...prev };
        const today = formatDate();

        // Add card to history
        const cardKey = response.card.reversed
          ? `${response.card.name_en}_R`
          : response.card.name_en;
        updated.card_history = [
          ...updated.card_history,
          { card_en: cardKey, date: today },
        ];

        // Add guest to history
        if (response.roundtable) {
          const guest = response.roundtable.find((m) => m.emoji === '🌟');
          if (guest) {
            updated.guest_history = [
              ...updated.guest_history,
              { name: guest.persona, date: today },
            ];
          }
        }

        // Update monthly card frequency
        updated.monthly_card_freq = { ...updated.monthly_card_freq };
        updated.monthly_card_freq[response.card.name_en] =
          (updated.monthly_card_freq[response.card.name_en] || 0) + 1;

        // Update monthly themes from input type
        if (response.meta?.input_type) {
          const theme = response.meta.input_type;
          if (!updated.monthly_themes.includes(theme)) {
            updated.monthly_themes = [...updated.monthly_themes, theme];
          }
        }

        return updated;
      });
    },
    [setState]
  );

  const saveFeedback = useCallback(
    (feedback: string) => {
      setState((prev) => ({ ...prev, recent_feedback: feedback }));
    },
    [setState]
  );

  return { state, updateAfterResponse, saveFeedback };
}
