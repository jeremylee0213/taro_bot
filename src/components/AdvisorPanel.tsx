'use client';

import { AdvisorComment } from '@/types/schedule';

interface AdvisorPanelProps {
  advisors: AdvisorComment[];
  onChangeAdvisors: () => void;
}

const AVATAR_COLORS = [
  '#007aff',
  '#34c759',
  '#ff9500',
];

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
  return '💡';
}

export function AdvisorPanel({
  advisors,
  onChangeAdvisors,
}: AdvisorPanelProps) {
  if (advisors.length === 0) return null;

  return (
    <div className="apple-card p-4 sm:p-6 space-y-4 fade-in" role="region" aria-label="조언자 인사이트">
      <div className="flex items-center justify-between">
        <h3 className="text-[20px] sm:text-[22px] font-bold" style={{ color: 'var(--color-text)' }}>
          💬 <span style={{ borderBottom: '3px solid var(--color-accent)', paddingBottom: '2px' }}>조언자 인사이트</span>
        </h3>
        <button
          onClick={onChangeAdvisors}
          className="text-[15px] font-semibold px-4 py-2.5 rounded-xl focus-ring"
          style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
          aria-label="조언자 변경"
        >
          🔄 변경
        </button>
      </div>

      <div className="space-y-4" role="list">
        {advisors.map((advisor, idx) => {
          const emoji = getAdvisorEmoji(advisor.name);
          const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];

          // Format comment with line breaks + highlight key phrases
          const formattedComment = advisor.comment
            .replace(/([.!?])\s+/g, '$1\n\n')
            .trim();

          return (
            <div
              key={idx}
              className="rounded-xl p-4"
              style={{
                background: 'var(--color-surface)',
                borderLeft: `4px solid ${color}`,
              }}
              role="listitem"
              aria-label={`조언자 ${idx + 1}: ${advisor.name}`}
            >
              <div className="flex items-start gap-3">
                {/* Number + Emoji avatar */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[20px]"
                    style={{ backgroundColor: color + '20' }}
                  >
                    {emoji}
                  </div>
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: color }}
                  >
                    #{idx + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] sm:text-[18px] font-bold mb-2" style={{ color }}>
                    {emoji} <span style={{ textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: color }}>{advisor.name}</span>
                  </p>
                  <div className="text-[15px] sm:text-[16px] leading-[1.8] whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
                    <em>&ldquo;{formattedComment}&rdquo;</em>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
