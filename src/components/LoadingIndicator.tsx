'use client';

export function LoadingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center text-sm">
        🔮
      </div>
      <div className="flex-1 space-y-2 py-1">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-gold pixel-shimmer" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-accent-gold pixel-shimmer" style={{ animationDelay: '0.3s' }} />
          <span className="w-2 h-2 rounded-full bg-accent-gold pixel-shimmer" style={{ animationDelay: '0.6s' }} />
        </div>
        <p className="text-xs text-text-muted">카드를 뽑고 있습니다...</p>
      </div>
    </div>
  );
}
