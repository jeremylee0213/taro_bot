import { TarotResponse } from '@/types/tarot';

export function parseResponse(raw: string): TarotResponse {
  const data = JSON.parse(raw);

  // Ensure required fields exist with defaults
  return {
    mode: data.mode || 'quick',
    card: {
      name_kr: data.card?.name_kr || '알 수 없음',
      name_en: data.card?.name_en || 'Unknown',
      number: data.card?.number ?? 0,
      reversed: data.card?.reversed ?? false,
      emoji_art: data.card?.emoji_art || '🃏',
      core_keywords: data.card?.core_keywords || ['', '', ''],
    },
    one_liner: data.one_liner || '',
    keywords: data.keywords || [],
    guide: data.guide || undefined,
    roundtable: data.roundtable || undefined,
    compass: data.compass || undefined,
    card_deep_reading: data.card_deep_reading || undefined,
    image_prompt: data.image_prompt || undefined,
    meta: data.meta || undefined,
  };
}
