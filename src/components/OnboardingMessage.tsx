'use client';

export function OnboardingMessage() {
  return (
    <div className="px-4 py-3">
      <div className="bg-card rounded-xl p-5 gold-border space-y-4">
        <div className="text-center space-y-2">
          <div className="text-3xl float-animation">🔮</div>
          <h2 className="text-lg font-bold text-accent-gold">Daily Tarot Mirror</h2>
        </div>

        <p className="text-sm text-text-primary leading-relaxed">
          매일 타로 카드 한 장을 거울삼아, 다양한 리더십 사고방식으로
          오늘의 전략을 함께 고민합니다.
        </p>

        <p className="text-xs text-text-muted italic">
          참고: 이 조언은 가상의 사고 실험이며, 실제 인물의 의견이 아닙니다.
          카드는 가능성을 비추는 거울이지, 운명의 예언이 아닙니다.
        </p>

        <div className="space-y-1.5">
          <p className="text-xs text-text-muted">이렇게 말씀해주시면 돼요:</p>
          <ul className="text-sm space-y-1 text-text-primary">
            <li>• &quot;오전 10시 투자자 미팅, 오후 아이 병원&quot;</li>
            <li>• &quot;이직을 고민하고 있어&quot;</li>
            <li>• &quot;오늘 기분이 좋지 않아&quot;</li>
            <li>• 그냥 &quot;카드 뽑아줘&quot;도 좋아요!</li>
          </ul>
        </div>

        <p className="text-sm text-accent-gold text-center pt-2">
          오늘 가장 마음에 걸리는 것 하나만 말씀해주세요. ✨
        </p>
      </div>
    </div>
  );
}
