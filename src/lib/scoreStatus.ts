export type ScoreLevel = "good" | "normal" | "low";

export interface ScoreStatus {
  level: ScoreLevel;
  label: string;
  color: string;       // tailwind bg
  textColor: string;   // tailwind text
  description: string;
}

export function getReactionTimeStatus(ms: number): ScoreStatus {
  if (ms < 230)
    return { level: "good",   label: "빠름",   color: "bg-green-100",  textColor: "text-green-700",  description: "집중력과 각성도가 높은 상태예요." };
  if (ms < 350)
    return { level: "normal", label: "보통",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "평균적인 반응 속도예요." };
  return   { level: "low",    label: "느림",   color: "bg-red-100",    textColor: "text-red-700",    description: "피로하거나 각성도가 낮을 수 있어요." };
}

export function getStroopAccuracyStatus(pct: number): ScoreStatus {
  if (pct >= 85)
    return { level: "good",   label: "높음",   color: "bg-green-100",  textColor: "text-green-700",  description: "주의력과 실행기능이 좋은 상태예요." };
  if (pct >= 70)
    return { level: "normal", label: "보통",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "평균적인 주의력이에요." };
  return   { level: "low",    label: "낮음",   color: "bg-red-100",    textColor: "text-red-700",    description: "집중이 잘 안 되는 상태일 수 있어요." };
}

export function getStroopAvgMsStatus(ms: number): ScoreStatus {
  if (ms < 600)
    return { level: "good",   label: "빠름",   color: "bg-green-100",  textColor: "text-green-700",  description: "색상 판단이 빠르고 정확한 상태예요." };
  if (ms < 1000)
    return { level: "normal", label: "보통",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "평균적인 처리 속도예요." };
  return   { level: "low",    label: "느림",   color: "bg-red-100",    textColor: "text-red-700",    description: "인지 처리 속도가 다소 느린 편이에요." };
}

export function getBalanceStatus(sec: number): ScoreStatus {
  if (sec >= 25)
    return { level: "good",   label: "좋음",   color: "bg-green-100",  textColor: "text-green-700",  description: "균형 능력이 좋아요." };
  if (sec >= 10)
    return { level: "normal", label: "보통",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "평균적인 균형 능력이에요." };
  return   { level: "low",    label: "낮음",   color: "bg-red-100",    textColor: "text-red-700",    description: "균형 유지가 어려운 상태예요." };
}

// Digit Span — WAIS (Wechsler 1939); Miller (1956) "7±2 rule" Psychological Review
// Adult norms: forward span 6-8 digits. ≥7 = above average, 5-6 = average, ≤4 = below average
export function getDigitSpanStatus(digits: number): ScoreStatus {
  if (digits >= 7)
    return { level: "good",   label: "우수",   color: "bg-green-100",  textColor: "text-green-700",  description: "작업기억이 좋은 상태예요." };
  if (digits >= 5)
    return { level: "normal", label: "보통",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "성인 평균 수준이에요." };
  return   { level: "low",    label: "저하",   color: "bg-red-100",    textColor: "text-red-700",    description: "피로·스트레스로 기억력이 낮아진 상태일 수 있어요." };
}

// NRS Pain — Downie et al. (1978); Farrar et al. PAIN 94(1-2):149-158 (2001)
// Severity cutoffs: Serlin et al. (1995) — 1-4 mild, 5-6 moderate, 7-10 severe
export function getPainStatus(score: number): ScoreStatus {
  if (score === 0)
    return { level: "good",   label: "통증 없음", color: "bg-green-100",  textColor: "text-green-700",  description: "통증이 없는 상태예요." };
  if (score <= 4)
    return { level: "good",   label: "경미",      color: "bg-green-100",  textColor: "text-green-700",  description: "일상생활에 지장 없는 수준이에요." };
  if (score <= 6)
    return { level: "normal", label: "중등도",    color: "bg-yellow-100", textColor: "text-yellow-700", description: "지속되면 전문가 상담을 권장해요." };
  return   { level: "low",    label: "심함",      color: "bg-red-100",    textColor: "text-red-700",    description: "의료진과 상담하세요." };
}

// NRS Fatigue — Bruera et al. J Pain Symptom Manage (1991); NCCN Cancer-Related Fatigue Guidelines
// Cutoffs adapted for general population: 0-3 mild/none, 4-6 moderate, 7-10 severe
export function getFatigueStatus(score: number): ScoreStatus {
  if (score <= 3)
    return { level: "good",   label: "피로 없음", color: "bg-green-100",  textColor: "text-green-700",  description: "컨디션이 좋은 상태예요." };
  if (score <= 6)
    return { level: "normal", label: "중등도",    color: "bg-yellow-100", textColor: "text-yellow-700", description: "적당한 휴식이 도움돼요." };
  return   { level: "low",    label: "심한 피로", color: "bg-red-100",    textColor: "text-red-700",    description: "충분한 수면과 회복이 필요해요." };
}

// PHQ-2 — Löwe et al. (2005) Medical Care 43(11). Cutoff ≥3: sensitivity 83%, specificity 92%
// Korean validation: Choi et al. (2007) J Korean Med Sci
export function getPHQ2Status(score: number): ScoreStatus {
  if (score <= 2)
    return { level: "good",   label: "양호",      color: "bg-green-100",  textColor: "text-green-700",  description: "위험 신호가 낮아요." };
  if (score <= 4)
    return { level: "normal", label: "주의",      color: "bg-yellow-100", textColor: "text-yellow-700", description: "기분 변화를 계속 기록해보세요." };
  return   { level: "low",    label: "상담 권장", color: "bg-red-100",    textColor: "text-red-700",    description: "지속되면 전문가 상담을 권장해요." };
}

// 30-Second Chair Stand Test — Rikli & Jones (1999, 2013) J Aging & Physical Activity
// Norms for 60-64yr: Women 12-17, Men 14-19. For younger adults, adjusted upward.
// Functional threshold: <10 warrants clinical attention regardless of age
export function getChairStandStatus(count: number): ScoreStatus {
  if (count >= 15)
    return { level: "good",   label: "양호",  color: "bg-green-100",  textColor: "text-green-700",  description: "하체 근력이 좋은 상태예요." };
  if (count >= 10)
    return { level: "normal", label: "보통",  color: "bg-yellow-100", textColor: "text-yellow-700", description: "평균적인 하체 기능 수준이에요." };
  return   { level: "low",    label: "저하",  color: "bg-red-100",    textColor: "text-red-700",    description: "하체 근력이 낮아요. 낙상 주의가 필요해요." };
}

/** 개인 평균 대비 변화율 */
export function calcTrend(current: number, personalAvg: number, higherIsBetter: boolean) {
  if (personalAvg === 0) return null;
  const changePct = Math.round(((current - personalAvg) / personalAvg) * 100);
  const improved = higherIsBetter ? changePct > 0 : changePct < 0;
  return { changePct: Math.abs(changePct), improved, direction: changePct > 0 ? "↑" : changePct < 0 ? "↓" : "—" };
}
