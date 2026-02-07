'use client';

import { Guide, TimelineItem, PerspectiveItem, EmotionJourney, ProsConsItem } from '@/types/tarot';

interface GuideSectionProps {
  guide: Guide;
}

export function GuideSection({ guide }: GuideSectionProps) {
  return (
    <div className="bg-card rounded-xl p-4 pixel-border space-y-3">
      <h3 className="text-sm font-bold text-accent-gold">
        📋 {guide.title || getDefaultTitle(guide.type)}
      </h3>

      {guide.type === 'timeline' && <TimelineView items={guide.content as TimelineItem[]} />}
      {guide.type === 'perspectives' && <PerspectivesView items={guide.content as PerspectiveItem[]} />}
      {guide.type === 'emotion_journey' && <EmotionView journey={guide.content as EmotionJourney} />}
      {guide.type === 'pros_cons' && <ProsConsView items={guide.content as ProsConsItem[]} />}
    </div>
  );
}

function getDefaultTitle(type: string): string {
  switch (type) {
    case 'timeline': return '오늘의 타임라인';
    case 'perspectives': return '다양한 관점';
    case 'emotion_journey': return '오늘의 감정 여정';
    case 'pros_cons': return '선택지 비교';
    default: return '가이드';
  }
}

function TimelineView({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex gap-3 p-3 rounded-lg ${
            item.is_family_time
              ? 'bg-amber-900/20 border border-amber-800/30'
              : 'bg-surface'
          }`}
        >
          <div className="flex-shrink-0 text-lg w-8 text-center">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-text-primary">{item.period}</span>
              {item.time && (
                <span className="text-xs text-text-muted">{item.time}</span>
              )}
              {item.energy && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${getEnergyStyle(item.energy)}`}>
                  {getEnergyLabel(item.energy)}
                </span>
              )}
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{item.advice}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getEnergyStyle(energy: string): string {
  switch (energy) {
    case 'high': return 'bg-red-500/20 text-red-400';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400';
    case 'rest': return 'bg-green-500/20 text-green-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

function getEnergyLabel(energy: string): string {
  switch (energy) {
    case 'high': return '⚡ 집중';
    case 'medium': return '🟡 보통';
    case 'rest': return '🟢 여유';
    default: return energy;
  }
}

function PerspectivesView({ items }: { items: PerspectiveItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="bg-surface rounded-lg p-3">
          <span className="text-xs font-bold text-accent-purple mr-2">관점 {item.label}</span>
          <p className="text-sm text-text-primary mt-1">{item.viewpoint}</p>
        </div>
      ))}
    </div>
  );
}

function EmotionView({ journey }: { journey: EmotionJourney }) {
  return (
    <div className="space-y-3">
      <div className="bg-surface rounded-lg p-3 border-l-2 border-blue-500">
        <p className="text-xs font-bold text-blue-400 mb-1">🌊 지금 이 순간</p>
        <p className="text-sm">{journey.current}</p>
      </div>
      <div className="flex justify-center">
        <span className="text-text-muted">↓</span>
      </div>
      <div className="bg-surface rounded-lg p-3 border-l-2 border-accent-purple">
        <p className="text-xs font-bold text-accent-purple mb-1">✨ 카드가 제안하는 전환</p>
        <p className="text-sm">{journey.transition}</p>
      </div>
      <div className="flex justify-center">
        <span className="text-text-muted">↓</span>
      </div>
      <div className="bg-surface rounded-lg p-3 border-l-2 border-accent-gold">
        <p className="text-xs font-bold text-accent-gold mb-1">🌙 저녁 마무리</p>
        <p className="text-sm">{journey.evening}</p>
      </div>
    </div>
  );
}

function ProsConsView({ items }: { items: ProsConsItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-surface rounded-lg p-3">
          <h4 className="text-sm font-bold text-text-primary mb-2">{item.option}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-green-400 mb-1">✅ 장점</p>
              {item.pros.map((p, j) => (
                <p key={j} className="text-xs text-text-primary">• {p}</p>
              ))}
            </div>
            <div>
              <p className="text-xs text-red-400 mb-1">⚠️ 단점</p>
              {item.cons.map((c, j) => (
                <p key={j} className="text-xs text-text-primary">• {c}</p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
