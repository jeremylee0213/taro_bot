'use client';

import { ConcertaDose, EnergyBlock } from '@/types/schedule';

interface ConcertaChartProps {
  doses: ConcertaDose[];
  energyData?: EnergyBlock[];
}

/**
 * Concerta OROS (methylphenidate) — real pharmacokinetic model
 * Based on FDA clinical data & published PK studies:
 *
 * OROS mechanism:
 * - Overcoat: 22% immediate release → Tmax ~1h, rapid Cmax
 * - Push-pull osmotic pump: 78% ascending release over 6-7h
 * - True Tmax: 6-8h post-dose (ascending plateau)
 * - Terminal t½: ~3.5h after release stops
 * - Total duration: ~12h
 *
 * Dose-linear PK: Cmax proportional to dose
 * Reference: Cmax ≈ 10 ng/mL per 18mg dose
 */
function getOROSCurve(doses: ConcertaDose[]): { hour: number; level: number; label: string }[] {
  const points: { hour: number; level: number; label: string }[] = [];

  // 30-minute resolution from 5:00 to 23:00
  for (let m = 300; m <= 1380; m += 30) {
    const h = m / 60;
    let totalConc = 0;
    const labels: string[] = [];

    for (const dose of doses) {
      const [dH, dM] = dose.time.split(':').map(Number);
      const doseMin = dH * 60 + dM;
      const elapsed = (m - doseMin) / 60; // hours since dose

      if (elapsed < 0) continue;

      // ng/mL per mg, normalized to 0-10 scale
      const doseScale = dose.doseMg / 18;

      let conc = 0;

      if (elapsed <= 1) {
        // Phase 1: IR overcoat absorption (22% dose)
        // Rapid rise, Tmax ~1h
        conc = 0.22 * doseScale * (1 - Math.exp(-2.5 * elapsed)) * 10;
      } else if (elapsed <= 2) {
        // Phase 2: IR declining + ER starting
        const irPeak = 0.22 * doseScale * 10;
        const irDecline = irPeak * Math.exp(-0.693 * (elapsed - 1) / 1.5);
        const erRise = 0.78 * doseScale * ((elapsed - 1) / 6) * 10;
        conc = irDecline + erRise;
      } else if (elapsed <= 6) {
        // Phase 3: IR residual + ER ascending pump release
        const irResidual = 0.22 * doseScale * 10 * Math.exp(-0.693 * (elapsed - 1) / 1.5);
        // Ascending delivery: linear increase to peak
        const erProgress = (elapsed - 1) / 6;
        const erConc = 0.78 * doseScale * erProgress * 10;
        conc = irResidual + erConc;
      } else if (elapsed <= 8) {
        // Phase 4: Peak plateau (Tmax region)
        const irResidual = 0.22 * doseScale * 10 * Math.exp(-0.693 * (elapsed - 1) / 1.5);
        const erPeak = 0.78 * doseScale * 10;
        // Slight plateau — pump nearing exhaustion
        const plateauFactor = 1 - 0.05 * (elapsed - 6);
        conc = irResidual + erPeak * plateauFactor;
      } else if (elapsed <= 12) {
        // Phase 5: Terminal elimination (t½ = 3.5h)
        const peakConc = 0.78 * doseScale * 10 * 0.9;
        conc = peakConc * Math.exp(-0.693 * (elapsed - 8) / 3.5);
      } else {
        // Phase 6: Mostly eliminated
        const peakConc = 0.78 * doseScale * 10 * 0.9;
        conc = peakConc * Math.exp(-0.693 * (elapsed - 8) / 3.5);
        if (conc < 0.2) conc = 0;
      }

      totalConc += conc;

      // Annotate key PK events
      if (elapsed >= 0.5 && elapsed < 1.5) labels.push(`${dose.doseMg}mg 초기방출`);
      else if (elapsed >= 6 && elapsed < 8) labels.push(`${dose.doseMg}mg 피크`);
      else if (elapsed >= 10 && elapsed < 11) labels.push(`효과 감소`);
    }

    points.push({
      hour: Math.round(h * 10) / 10,
      level: Math.round(totalConc * 100) / 100,
      label: labels.join(' + ') || '',
    });
  }

  return points;
}

export function ConcertaChart({ doses, energyData }: ConcertaChartProps) {
  if (!doses || doses.length === 0) return null;

  const curve = getOROSCurve(doses);
  const rawMax = Math.max(...curve.map((c) => c.level), 1);
  const maxConc = rawMax * 1.2; // 20% headroom so peak is clearly visible
  const peakPoint = curve.reduce((max, p) => p.level > max.level ? p : max, curve[0]);

  // Energy data mapping
  const sortedEnergy = energyData ? [...energyData].sort((a, b) => a.hour - b.hour) : [];
  const maxEnergy = 10;

  // SVG dimensions — increased height for better peak visibility
  const W = 400, H = 200;
  const PAD_L = 36, PAD_R = 10, PAD_T = 20, PAD_B = 25;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const hourToX = (hour: number) => PAD_L + ((hour - 5) / 18) * plotW;
  const concToY = (level: number) => PAD_T + plotH - (level / maxConc) * plotH;
  const energyToY = (level: number) => PAD_T + plotH - (level / maxEnergy) * plotH;

  const concPath = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${hourToX(p.hour)},${concToY(p.level)}`).join(' ');
  const concArea = `${concPath} L ${hourToX(curve[curve.length - 1].hour)},${PAD_T + plotH} L ${hourToX(curve[0].hour)},${PAD_T + plotH} Z`;

  const peakHourDisplay = Math.round(peakPoint.hour);

  return (
    <div className="apple-card p-5 fade-in">
      <h3 className="text-[20px] font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        💊 콘서타 농도 + ⚡ 에너지
      </h3>
      <p className="text-[14px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
        {doses.map((d) => `🕐 ${d.time} ${d.doseMg}mg`).join('  ')} · <strong style={{ color: 'var(--color-accent)' }}>피크 ~{peakHourDisplay}시 ({peakPoint.level.toFixed(1)})</strong>
      </p>

      {/* Combined SVG chart */}
      <div style={{ width: '100%', aspectRatio: `${W}/${H}`, position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, gi) => (
            <line
              key={gi}
              x1={PAD_L} y1={PAD_T + (1 - pct) * plotH}
              x2={W - PAD_R} y2={PAD_T + (1 - pct) * plotH}
              stroke="var(--color-border)"
              strokeWidth="0.5"
              strokeDasharray={pct === 0 ? 'none' : '3,3'}
            />
          ))}

          {/* Concerta area fill */}
          <path d={concArea} fill="var(--color-accent)" opacity="0.1" />

          {/* Concerta line */}
          <path d={concPath} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Energy bars (background) */}
          {sortedEnergy.map((e, ei) => {
            const x = hourToX(e.hour) - 6;
            const barH = (e.level / maxEnergy) * plotH;
            const y = PAD_T + plotH - barH;
            const color = e.level >= 7 ? 'var(--color-success)' : e.level >= 4 ? 'var(--color-warning)' : 'var(--color-danger)';
            return (
              <rect
                key={ei}
                x={x} y={y}
                width={12} height={barH}
                rx={3}
                fill={color}
                opacity={0.25}
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <text
              key={`ylabel-${pct}`}
              x={PAD_L - 4}
              y={PAD_T + (1 - pct) * plotH + 3}
              textAnchor="end"
              fill="var(--color-text-muted)"
              fontSize="8"
            >
              {Math.round(maxConc * pct * 10) / 10}
            </text>
          ))}

          {/* Peak marker — larger and with value label */}
          <circle cx={hourToX(peakPoint.hour)} cy={concToY(peakPoint.level)} r="6" fill="var(--color-accent)" />
          <circle cx={hourToX(peakPoint.hour)} cy={concToY(peakPoint.level)} r="12" fill="var(--color-accent)" opacity="0.12" />
          <text
            x={hourToX(peakPoint.hour)}
            y={concToY(peakPoint.level) - 12}
            textAnchor="middle"
            fill="var(--color-accent)"
            fontSize="10"
            fontWeight="bold"
          >
            🔝 {peakPoint.level.toFixed(1)}
          </text>

          {/* Dose intake markers */}
          {doses.map((dose, di) => {
            const [dH, dM] = dose.time.split(':').map(Number);
            const x = hourToX(dH + dM / 60);
            return (
              <g key={di}>
                <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + plotH} stroke="var(--color-warning)" strokeWidth="1.2" strokeDasharray="4,3" />
                <text x={x} y={PAD_T - 3} textAnchor="middle" fill="var(--color-warning)" fontSize="9" fontWeight="bold">
                  💊{dose.doseMg}mg
                </text>
              </g>
            );
          })}

          {/* Hour labels */}
          {[5, 8, 11, 14, 17, 20, 23].map((hr) => (
            <text key={hr} x={hourToX(hr)} y={H - 3} textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">
              {hr}시
            </text>
          ))}

          {/* Legend */}
          <line x1={PAD_L + 5} y1={PAD_T + 3} x2={PAD_L + 25} y2={PAD_T + 3} stroke="var(--color-accent)" strokeWidth="2.5" />
          <text x={PAD_L + 28} y={PAD_T + 6} fill="var(--color-accent)" fontSize="8">콘서타</text>
          {sortedEnergy.length > 0 && (
            <>
              <rect x={PAD_L + 70} y={PAD_T - 1} width={8} height={8} rx={2} fill="var(--color-success)" opacity={0.4} />
              <text x={PAD_L + 82} y={PAD_T + 6} fill="var(--color-text-muted)" fontSize="8">에너지</text>
            </>
          )}
        </svg>
      </div>

      {/* Key info badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {doses.map((d, i) => (
          <span key={i} className="text-[13px] px-3 py-1.5 rounded-full font-semibold"
            style={{ background: 'var(--color-warning)', color: '#fff' }}>
            💊 {d.time} · {d.doseMg}mg
          </span>
        ))}
        <span className="text-[13px] px-3 py-1.5 rounded-full font-semibold"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          🔝 피크 ~{peakHourDisplay}시
        </span>
      </div>
    </div>
  );
}
