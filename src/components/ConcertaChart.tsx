'use client';

import { ConcertaDose } from '@/types/schedule';

interface ConcertaChartProps {
  doses: ConcertaDose[];
}

/**
 * Concerta (methylphenidate OROS) pharmacokinetic model
 * - Initial release: ~22% immediate, peaks at ~1h
 * - Extended release: ~78%, ascending pattern peaks at ~6-8h
 * - Combined: bi-phasic curve with ascending plateau
 *
 * Simplified model: concentration = dose * (rapid_phase + extended_phase)
 */
function getConcertaCurve(doses: ConcertaDose[]): { hour: number; level: number; label: string }[] {
  const points: { hour: number; level: number; label: string }[] = [];

  // Generate hourly points from 5am to 23pm
  for (let h = 5; h <= 23; h++) {
    let totalLevel = 0;
    const labels: string[] = [];

    for (const dose of doses) {
      const [dH, dM] = dose.time.split(':').map(Number);
      const doseHour = dH + dM / 60;
      const elapsed = h - doseHour;

      if (elapsed < 0) continue; // not yet taken

      // Dose-dependent scaling (base = 27mg)
      const doseScale = dose.doseMg / 27;

      // Bi-phasic Concerta model
      let concentration = 0;
      if (elapsed <= 1) {
        // Rapid rise (22% IR)
        concentration = 0.22 * doseScale * (elapsed / 1) * 10;
      } else if (elapsed <= 4) {
        // Slight dip after IR, ER building up
        const irDecay = 0.22 * doseScale * Math.exp(-(elapsed - 1) * 0.5) * 10;
        const erRise = 0.78 * doseScale * ((elapsed - 1) / 5) * 10;
        concentration = irDecay + erRise;
      } else if (elapsed <= 8) {
        // Peak plateau (ER dominant)
        const erPeak = 0.78 * doseScale * Math.min(1, (elapsed - 1) / 5) * 10;
        const irResidual = 0.22 * doseScale * Math.exp(-(elapsed - 1) * 0.5) * 10;
        concentration = erPeak + irResidual;
      } else if (elapsed <= 12) {
        // Decline phase
        const peakVal = 0.78 * doseScale * 10;
        concentration = peakVal * Math.exp(-(elapsed - 8) * 0.35);
      } else {
        // Mostly worn off
        concentration = 0.78 * doseScale * 10 * Math.exp(-(elapsed - 8) * 0.35);
        if (concentration < 0.3) concentration = 0;
      }

      totalLevel += concentration;

      // Label key moments
      if (elapsed >= 0.5 && elapsed <= 1.5) {
        labels.push(`${dose.doseMg}mg 초기방출`);
      } else if (elapsed >= 5 && elapsed <= 7) {
        labels.push(`${dose.doseMg}mg 피크`);
      } else if (elapsed >= 10 && elapsed <= 11) {
        labels.push(`${dose.doseMg}mg 감소`);
      }
    }

    points.push({
      hour: h,
      level: Math.round(Math.min(totalLevel, 10) * 10) / 10,
      label: labels.join(' + ') || '',
    });
  }

  return points;
}

function getLevelColor(level: number): string {
  if (level >= 7) return 'var(--color-success)';
  if (level >= 4) return 'var(--color-accent)';
  if (level >= 2) return 'var(--color-warning)';
  return 'var(--color-text-muted)';
}

export function ConcertaChart({ doses }: ConcertaChartProps) {
  if (!doses || doses.length === 0) return null;

  const curve = getConcertaCurve(doses);
  const maxLevel = Math.max(...curve.map((c) => c.level), 1);

  // Find peak hour
  const peakPoint = curve.reduce((max, p) => p.level > max.level ? p : max, curve[0]);

  return (
    <div className="apple-card p-5 fade-in">
      <h3 className="text-[20px] font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        💊 콘서타 농도 곡선
      </h3>
      <p className="text-[14px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {doses.map((d) => `${d.time} ${d.doseMg}mg`).join(' + ')} · 피크 {peakPoint.hour}시
      </p>

      {/* SVG Line chart */}
      <div style={{ width: '100%', height: '160px', position: 'relative' }}>
        <svg viewBox="0 0 400 140" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1="30" y1={10 + (1 - pct) * 110}
              x2="390" y2={10 + (1 - pct) * 110}
              stroke="var(--color-border)"
              strokeWidth="0.5"
              strokeDasharray={pct === 0 ? 'none' : '3,3'}
            />
          ))}

          {/* Area fill */}
          <path
            d={`M ${curve.map((p, i) => {
              const x = 30 + (i / (curve.length - 1)) * 360;
              const y = 120 - (p.level / maxLevel) * 110;
              return `${x},${y}`;
            }).join(' L ')} L ${30 + 360},120 L 30,120 Z`}
            fill="var(--color-accent)"
            opacity="0.12"
          />

          {/* Line */}
          <polyline
            points={curve.map((p, i) => {
              const x = 30 + (i / (curve.length - 1)) * 360;
              const y = 120 - (p.level / maxLevel) * 110;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Peak dot */}
          {(() => {
            const peakIdx = curve.indexOf(peakPoint);
            const px = 30 + (peakIdx / (curve.length - 1)) * 360;
            const py = 120 - (peakPoint.level / maxLevel) * 110;
            return (
              <>
                <circle cx={px} cy={py} r="5" fill="var(--color-accent)" />
                <circle cx={px} cy={py} r="8" fill="var(--color-accent)" opacity="0.2" />
              </>
            );
          })()}

          {/* Dose intake markers */}
          {doses.map((dose, di) => {
            const [dH] = dose.time.split(':').map(Number);
            const idx = curve.findIndex((c) => c.hour === dH);
            if (idx < 0) return null;
            const x = 30 + (idx / (curve.length - 1)) * 360;
            return (
              <g key={di}>
                <line x1={x} y1={10} x2={x} y2={120} stroke="var(--color-warning)" strokeWidth="1" strokeDasharray="4,3" />
                <text x={x} y={8} textAnchor="middle" fill="var(--color-warning)" fontSize="9" fontWeight="bold">
                  💊{dose.doseMg}mg
                </text>
              </g>
            );
          })}

          {/* Hour labels */}
          {curve.filter((_, i) => i % 3 === 0 || i === curve.length - 1).map((p) => {
            const idx = curve.indexOf(p);
            const x = 30 + (idx / (curve.length - 1)) * 360;
            return (
              <text key={p.hour} x={x} y={135} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">
                {p.hour}시
              </text>
            );
          })}
        </svg>
      </div>

      {/* Key moments */}
      <div className="flex flex-wrap gap-2 mt-3">
        {doses.map((d, i) => (
          <span
            key={i}
            className="text-[13px] px-3 py-1 rounded-full font-medium"
            style={{ background: 'var(--color-warning)', color: '#fff', opacity: 0.9 }}
          >
            🕐 {d.time} · {d.doseMg}mg
          </span>
        ))}
        <span
          className="text-[13px] px-3 py-1 rounded-full font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          🔝 피크 {peakPoint.hour}시 ({peakPoint.level.toFixed(1)})
        </span>
      </div>
    </div>
  );
}
