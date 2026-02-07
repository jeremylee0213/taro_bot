'use client';

import { RoundtableMember } from '@/types/tarot';

interface RoundtableSectionProps {
  members: RoundtableMember[];
}

const relationLabels: Record<string, string> = {
  agree: '동의',
  counter: '반론',
  extend: '보충',
  independent: '',
};

export function RoundtableSection({ members }: RoundtableSectionProps) {
  return (
    <div className="bg-card rounded-xl p-4 pixel-border space-y-3">
      <h3 className="text-sm font-bold text-accent-gold">💬 리더십 라운드테이블</h3>

      <div className="space-y-2">
        {members.map((member, i) => (
          <div key={i}>
            {/* Relation indicator */}
            {i > 0 && member.relation_to_prev && member.relation_to_prev !== 'independent' && (
              <div className="flex items-center justify-center py-1">
                <span className="text-xs text-text-muted">
                  ↕️ {relationLabels[member.relation_to_prev]}
                </span>
              </div>
            )}

            <div className="bg-surface rounded-lg p-3">
              {/* Persona header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{member.emoji}</span>
                <span className="text-sm font-bold text-text-primary">{member.persona}</span>
                <span className="text-xs text-text-muted">({member.archetype})</span>
              </div>

              {/* Quote */}
              <p className="text-sm text-text-primary italic pl-3 border-l border-text-muted/30 mb-2">
                &quot;{member.quote}&quot;
              </p>

              {/* Key point */}
              <p className="text-xs text-accent-gold">
                → 핵심: {member.key_point}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
