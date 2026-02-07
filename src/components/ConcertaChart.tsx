'use client';

import { ConcertaDose, EnergyBlock } from '@/types/schedule';

interface ConcertaChartProps {
  doses: ConcertaDose[];
  energyData?: EnergyBlock[];
}

/**
 * Concerta OROS (methylphenidate) — evidence-based biphasic PK model
 *
 * Based on FDA label & Modi et al. (2000) clinical PK data:
 *
 * OROS mechanism:
 * - Overcoat: 22% immediate release → 1st peak (Tmax ~1-1.5h)
 * - Osmotic push-pull core: 78% extended release → 2nd peak (Tmax ~6-8h)
 *
 * Biphasic profile (per 18mg dose, approximate):
 * - 1st peak: ~3.4 ng/mL at ~1-1.5h (IR overcoat)
 * - Dip/trough: ~2.5 ng/mL at ~3-4h (IR declining, ER not yet dominant)
 * - 2nd peak: ~5.9 ng/mL at ~6-7h (ER osmotic peak) — 1.74× higher than 1st
 * - Terminal t½: ~3.5h after pump exhaustion (~8h)
 * - Total duration: ~12h
 *
 * References:
 * - FDA Concerta label (2017) 021121s038
 * - Modi et al., Biopharm Drug Dispos. 2000;21(2):73-80
 * - Swanson et al., Aliment Pharmacol Ther. 2003;17 Suppl 2:18-23
 */
function getOROSCurve(doses: ConcertaDose[]): { hour: number; level: number; label: string }[] {
  const points: { hour: number; level: number; label: string }[] = [];

  // 15-minute resolution from 5:00 to 23:00 for smoother curve
  for (let m = 300; m <= 1380; m += 15) {
    const h = m / 60;
    let totalConc = 0;
    const labels: string[] = [];

    for (const dose of doses) {
      const [dH, dM] = dose.time.split(':').map(Number);
      const doseMin = dH * 60 + dM;
      const elapsed = (m - doseMin) / 60; // hours since dose

      if (elapsed < 0) continue;

      // Normalize: 18mg → scale 1.0
      const doseScale = dose.doseMg / 18;

      // ── IR component (22% of dose) ──
      // Rapid absorption, Tmax ~1h, then elimination t½ ~2h
      let irConc = 0;
      if (elapsed <= 1) {
        // Absorption phase: rapid rise to IR peak
        irConc = 3.4 * doseScale * (1 - Math.exp(-3.0 * elapsed));
      } else {
        // Elimination: t½ ~2h from peak
        const irPeak = 3.4 * doseScale;
        irConc = irPeak * Math.exp(-0.693 * (elapsed - 1) / 2.0);
      }

      // ── ER component (78% of dose) ──
      // Osmotic pump: slow ascending release over 6-7h, then stops
      let erConc = 0;
      if (elapsed <= 1) {
        // Minimal ER release in first hour (still in stomach)
        erConc = 0;
      } else if (elapsed <= 7) {
        // Ascending osmotic release: sigmoid-like ramp to ER peak
        // Peak at ~6-7h: 5.9 ng/mL for 18mg
        const erPeakConc = 5.9 * doseScale;
        const progress = (elapsed - 1) / 6; // 0→1 over 6 hours
        // Sigmoid curve for more realistic ascending pattern
        const sigmoid = 1 / (1 + Math.exp(-6 * (progress - 0.55)));
        erConc = erPeakConc * sigmoid;
      } else if (elapsed <= 8) {
        // Peak plateau region: pump nearing exhaustion
        const erPeakConc = 5.9 * doseScale;
        const plateauDecay = 1 - 0.08 * (elapsed - 7);
        erConc = erPeakConc * plateauDecay;
      } else {
        // Terminal elimination: pump exhausted, t½ ~3.5h
        const erPeakConc = 5.9 * doseScale * 0.92; // value at hour 8
        erConc = erPeakConc * Math.exp(-0.693 * (elapsed - 8) / 3.5);
      }

      const conc = irConc + erConc;
      totalConc += conc;

      // Annotate key PK events
      if (elapsed >= 0.5 && elapsed < 1.5) labels.push(`${dose.doseMg}mg 1차 피크`);
      else if (elapsed >= 3 && elapsed < 4) labels.push(`${dose.doseMg}mg 중간 저점`);
      else if (elapsed >= 5.5 && elapsed < 7.5) labels.push(`${dose.doseMg}mg 2차 피크`);
      else if (elapsed >= 10 && elapsed < 11) labels.push(`효과 감소`);
    }

    if (totalConc < 0.15) totalConc = 0;

    points.push({
      hour: Math.round(h * 100) / 100,
      level: Math.round(totalConc * 100) / 100,
      label: labels.join(' + ') || '',
    });
  }

  return points;
}

/** Find local peaks (1st and 2nd) in the curve */
function findPeaks(curve: { hour: number; level: number }[]): { hour: number; level: number }[] {
  const peaks: { hour: number; level: number }[] = [];
  for (let i = 2; i < curve.length - 2; i++) {
    if (
      curve[i].level > curve[i - 1].level &&
      curve[i].level > curve[i - 2].level &&
      curve[i].level >= curve[i + 1].level &&
      curve[i].level >= curve[i + 2].level &&
      curve[i].level > 0.5
    ) {
      // Avoid duplicate peaks too close together
      if (peaks.length === 0 || curve[i].hour - peaks[peaks.length - 1].hour > 2) {
        peaks.push({ hour: curve[i].hour, level: curve[i].level });
      } else if (curve[i].level > peaks[peaks.length - 1].level) {
        peaks[peaks.length - 1] = { hour: curve[i].hour, level: curve[i].level };
      }
    }
  }
  return peaks;
}

export function ConcertaChart({ doses, energyData }: ConcertaChartProps) {
  if (!doses || doses.length === 0) return null;

  const curve = getOROSCurve(doses);
  const rawMax = Math.max(...curve.map((c) => c.level), 1);
  const maxConc = rawMax * 1.2; // 20% headroom
  const globalPeak = curve.reduce((max, p) => p.level > max.level ? p : max, curve[0]);
  const peaks = findPeaks(curve);

  // Energy data mapping
  const sortedEnergy = energyData ? [...energyData].sort((a, b) => a.hour - b.hour) : [];
  const maxEnergy = 10;

  // SVG dimensions
  const W = 400, H = 210;
  const PAD_L = 36, PAD_R = 10, PAD_T = 22, PAD_B = 25;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const hourToX = (hour: number) => PAD_L + ((hour - 5) / 18) * plotW;
  const concToY = (level: number) => PAD_T + plotH - (level / maxConc) * plotH;
  const energyToY = (level: number) => PAD_T + plotH - (level / maxEnergy) * plotH;

  const concPath = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${hourToX(p.hour)},${concToY(p.level)}`).join(' ');
  const concArea = `${concPath} L ${hourToX(curve[curve.length - 1].hour)},${PAD_T + plotH} L ${hourToX(curve[0].hour)},${PAD_T + plotH} Z`;

  const peakHourDisplay = Math.round(globalPeak.hour);

  // Build peak info text
  const peakInfoParts = peaks.map((p, i) => {
    const label = i === 0 ? '1차' : '2차';
    return `${label} ~${Math.round(p.hour)}시(${p.level.toFixed(1)})`;
  });
  const peakInfoText = peakInfoParts.length > 0
    ? peakInfoParts.join(' → ')
    : `피크 ~${peakHourDisplay}시 (${globalPeak.level.toFixed(1)})`;

  return (
    <div className="apple-card p-5 fade-in">
      <h3 className="text-[20px] font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        💊 콘서타 농도 + ⚡ 에너지
      </h3>
      <p className="text-[14px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
        {doses.map((d) => `🕐 ${d.time} ${d.doseMg}mg`).join('  ')} · <strong style={{ color: 'var(--color-accent)' }}>{peakInfoText}</strong>
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

          {/* Peak markers — show both peaks */}
          {peaks.map((peak, pi) => (
            <g key={`peak-${pi}`}>
              <circle cx={hourToX(peak.hour)} cy={concToY(peak.level)} r="5" fill="var(--color-accent)" />
              <circle cx={hourToX(peak.hour)} cy={concToY(peak.level)} r="11" fill="var(--color-accent)" opacity="0.12" />
              <text
                x={hourToX(peak.hour)}
                y={concToY(peak.level) - 10}
                textAnchor="middle"
                fill="var(--color-accent)"
                fontSize="9"
                fontWeight="bold"
              >
                {pi === 0 ? '1️⃣' : '2️⃣'} {peak.level.toFixed(1)}
              </text>
            </g>
          ))}

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
        {peaks.map((p, i) => (
          <span key={`peak-${i}`} className="text-[13px] px-3 py-1.5 rounded-full font-semibold"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {i === 0 ? '1️⃣' : '2️⃣'} {i === 0 ? '1차' : '2차'} 피크 ~{Math.round(p.hour)}시
          </span>
        ))}
      </div>
    </div>
  );
}
