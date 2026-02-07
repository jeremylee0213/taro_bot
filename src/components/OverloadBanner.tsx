'use client';

interface OverloadBannerProps {
  overloadMessage: string | null;
  recoverySuggestions: string[];
  energyTip: string | null;
}

export function OverloadBanner({ overloadMessage, recoverySuggestions, energyTip }: OverloadBannerProps) {
  if (!overloadMessage && recoverySuggestions.length === 0 && !energyTip) return null;

  return (
    <div className="space-y-2 fade-in">
      {overloadMessage && (
        <div className="flex items-start gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg">
          <span className="text-sm mt-0.5">⚠️</span>
          <p className="text-xs text-text-primary">{overloadMessage}</p>
        </div>
      )}
      {recoverySuggestions.map((s, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/20 rounded-lg">
          <span className="text-sm mt-0.5">💡</span>
          <p className="text-xs text-text-primary">{s}</p>
        </div>
      ))}
      {energyTip && (
        <div className="flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg">
          <span className="text-sm mt-0.5">⚡</span>
          <p className="text-xs text-text-primary">{energyTip}</p>
        </div>
      )}
    </div>
  );
}
