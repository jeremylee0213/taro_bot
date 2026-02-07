'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/types/schedule';

interface ShareButtonProps {
  result: AnalysisResult;
}

function formatResultText(result: AnalysisResult): string {
  const lines: string[] = ['🤖 플랜Bot\n'];

  if (result.overall_tip) {
    lines.push(`💡 ${result.overall_tip}\n`);
  }

  if (result.advisors.length > 0) {
    lines.push('💬 전문가 조언:');
    result.advisors.forEach((a) => {
      lines.push(`  ${a.initials} ${a.name}: "${a.comment}"`);
    });
  }

  if (result.daily_neuro_summary) {
    lines.push(`\n🧠 ${result.daily_neuro_summary}`);
  }

  return lines.join('\n');
}

export function ShareButton({ result }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = formatResultText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[15px] font-medium flex items-center gap-1"
      style={{ color: 'var(--color-accent)' }}
    >
      {copied ? '✓ 복사됨' : '📋 복사'}
    </button>
  );
}
