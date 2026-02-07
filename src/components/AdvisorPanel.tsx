'use client';

import { AdvisorComment, AdvisorTone } from '@/types/schedule';

interface AdvisorPanelProps {
  advisors: AdvisorComment[];
  tone: AdvisorTone;
  onChangeTone: (tone: AdvisorTone) => void;
  onChangeAdvisors: () => void;
}

const AVATAR_COLORS = [
  '#007aff',
  '#34c759',
  '#ff9500',
];

// Map advisor names / styles to fitting emojis
function getAdvisorEmoji(name: string): string {
  const lower = name.toLowerCase();
  const map: [string[], string][] = [
    [['일론', 'elon', 'musk'], '🚀'],
    [['워런', 'warren', 'buffett', '버핏'], '💰'],
    [['사티아', 'satya', 'nadella', '나델라'], '☁️'],
    [['제프', 'jeff', 'bezos', '베조스'], '📦'],
    [['레이', 'ray', 'dalio', '달리오'], '📐'],
    [['스티브', 'steve', 'jobs', '잡스'], '🍎'],
    [['빌', 'bill', 'gates', '게이츠'], '🖥️'],
    [['젠슨', 'jensen', 'huang', '황'], '🎮'],
    [['브레네', 'brené', 'brown', '브라운'], '💗'],
    [['아담', 'adam', 'grant', '그랜트'], '📚'],
    [['오프라', 'oprah', 'winfrey', '윈프리'], '✨'],
    [['마이클', 'michael', 'jordan', '조던'], '🏀'],
    [['필', 'phil', 'jackson', '잭슨'], '🧘'],
    [['이건희', 'lee'], '🏢'],
    [['방시혁', 'bang'], '🎵'],
    [['유재석'], '😄'],
    [['손흥민'], '⚽'],
    [['김연아'], '⛸️'],
    [['bts', '방탄'], '🎤'],
    [['예수', 'jesus'], '✝️'],
    [['부처', 'buddha'], '☸️'],
    [['공자', 'confucius'], '📜'],
    [['아인슈타인', 'einstein'], '⚛️'],
    [['나폴레옹', 'napoleon'], '⚔️'],
    [['처칠', 'churchill'], '🎩'],
  ];
  for (const [keywords, emoji] of map) {
    if (keywords.some(k => lower.includes(k))) return emoji;
  }
  // Default emoji based on position
  return '💡';
}

const DEFAULT_EMOJIS = ['🥇', '🥈', '🥉'];

export function AdvisorPanel({
  advisors,
  tone,
  onChangeTone,
  onChangeAdvisors,
}: AdvisorPanelProps) {
  if (advisors.length === 0) return null;

  return (
    <div className="apple-card p-5 space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-[20px] font-bold" style={{ color: 'var(--color-text)' }}>💬 전문가 조언</h3>
        <button
          onClick={onChangeAdvisors}
          className="text-[16px] font-semibold px-3 py-1.5 rounded-xl"
          style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
        >
          🔄 변경
        </button>
      </div>

      <div className="space-y-4">
        {advisors.map((advisor, idx) => {
          const emoji = getAdvisorEmoji(advisor.name) || DEFAULT_EMOJIS[idx];
          return (
            <div key={idx} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-[22px]"
                style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] + '20' }}
              >
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-bold" style={{ color: 'var(--color-text)' }}>
                  {emoji} {advisor.name}
                </p>
                <p className="text-[16px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  &ldquo;{advisor.comment}&rdquo;
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tone selector */}
      <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-[15px] font-medium" style={{ color: 'var(--color-text-muted)' }}>🎯 톤</span>
        <select
          value={tone}
          onChange={(e) => onChangeTone(e.target.value as AdvisorTone)}
          className="text-[16px] px-3 py-2 rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          <option value="encouraging">🤝 격려</option>
          <option value="direct">⚡ 직설</option>
        </select>
      </div>
    </div>
  );
}
