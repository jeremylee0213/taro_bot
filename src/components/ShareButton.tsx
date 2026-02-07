'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/types/schedule';

interface ShareButtonProps {
  result: AnalysisResult;
}

function formatResultText(result: AnalysisResult): string {
  const lines: string[] = ['📋 Daily CEO Planner — 분석 결과\n'];

  if (result.overall_tip) {
    lines.push(`💡 전략: ${result.overall_tip}\n`);
  }

  result.briefings.forEach((b) => {
    lines.push(`\n── ${b.title} ──`);
    lines.push('Before:');
    b.before.forEach((item) => lines.push(`  • ${item}`));
    lines.push('During:');
    b.during.forEach((item) => lines.push(`  • ${item}`));
    lines.push('After:');
    b.after.forEach((item) => lines.push(`  • ${item}`));
    if (b.transition) lines.push(`→ ${b.transition}`);
  });

  if (result.advisors.length > 0) {
    lines.push('\n💬 조언자:');
    result.advisors.forEach((a) => {
      lines.push(`  ${a.initials} ${a.name}: "${a.comment}"`);
    });
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
      // Fallback
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
      className="text-xs text-accent hover:underline flex items-center gap-1"
    >
      {copied ? '✓ 복사됨' : '📋 복사'}
    </button>
  );
}
