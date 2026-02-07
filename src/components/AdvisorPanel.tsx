'use client';

import { useCallback, useRef } from 'react';
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

async function copyItemAsImage(el: HTMLElement) {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch {
        const link = document.createElement('a');
        link.download = 'advisor.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }, 'image/png');
  } catch { /* silent */ }
}

async function downloadItemAsImage(el: HTMLElement, name: string) {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch { /* silent */ }
}

export function AdvisorPanel({
  advisors,
  onChangeAdvisors,
}: AdvisorPanelProps) {
  if (advisors.length === 0) return null;

  return (
    <div className="apple-card p-4 sm:p-6 space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-[20px] sm:text-[22px] font-bold" style={{ color: 'var(--color-text)' }}>
          💬 조언자 인사이트
        </h3>
        <button
          onClick={onChangeAdvisors}
          className="text-[15px] font-semibold px-3 py-1.5 rounded-xl"
          style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
        >
          🔄 변경
        </button>
      </div>

      <div className="space-y-4">
        {advisors.map((advisor, idx) => (
          <AdvisorRow key={idx} advisor={advisor} index={idx + 1} />
        ))}
      </div>
    </div>
  );
}

function AdvisorRow({ advisor, index }: { advisor: AdvisorComment; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const emoji = getAdvisorEmoji(advisor.name);

  const handleCopy = useCallback(() => {
    if (rowRef.current) copyItemAsImage(rowRef.current);
  }, []);

  const handleDownload = useCallback(() => {
    if (rowRef.current) downloadItemAsImage(rowRef.current, `advisor-${index}`);
  }, [index]);

  // Format comment with line breaks for readability
  const formattedComment = advisor.comment
    .replace(/([.!?])\s+/g, '$1\n\n')
    .trim();

  return (
    <div
      ref={rowRef}
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-surface)',
        borderLeft: `4px solid ${AVATAR_COLORS[(index - 1) % AVATAR_COLORS.length]}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Number + Emoji avatar */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-[20px]"
            style={{ backgroundColor: AVATAR_COLORS[(index - 1) % AVATAR_COLORS.length] + '20' }}
          >
            {emoji}
          </div>
          <span
            className="text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: AVATAR_COLORS[(index - 1) % AVATAR_COLORS.length] }}
          >
            #{index}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[17px] sm:text-[18px] font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {emoji} {advisor.name}
          </p>
          <div className="text-[15px] sm:text-[16px] leading-[1.8] whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
            &ldquo;{formattedComment}&rdquo;
          </div>
        </div>

        {/* Copy + Download */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] transition-all hover:scale-110"
            style={{ background: 'var(--color-accent-light)' }}
            title="클립보드 이미지 복사"
          >
            📋
          </button>
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] transition-all hover:scale-110"
            style={{ background: 'var(--color-accent-light)' }}
            title="이미지 저장"
          >
            📸
          </button>
        </div>
      </div>
    </div>
  );
}
