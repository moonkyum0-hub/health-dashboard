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
    return { level: "good",   label: "좋음",   color: "bg-green-100",  textColor: "text-green-700",  description: "균형 능력이 좋은 상태예요." };
  if (sec >= 10)
    return { level: "normal", label: "보통",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "평균적인 균형 능력이에요." };
  return   { level: "low",    label: "낮음",   color: "bg-red-100",    textColor: "text-red-700",    description: "균형 유지가 어려운 상태예요. 꾸준한 연습이 도움돼요." };
}

// Digit Span — WAIS (Wechsler 1939); Miller (1956) "7±2 rule" Psychological Review
// Adult norms: forward span 6-8 digits. ≥7 = above average, 5-6 = average, ≤4 = below average
export function getDigitSpanStatus(digits: number): ScoreStatus {
  if (digits >= 7)
    return { level: "good",   label: "우수",   color: "bg-green-100",  textColor: "text-green-700",  description: "작업기억 용량이 좋은 상태예요. 학습·집중 효율이 높을 가능성이 커요." };
  if (digits >= 5)
    return { level: "normal", label: "보통",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "성인 평균(6-7자리) 수준이에요." };
  return   { level: "low",    label: "저하",   color: "bg-red-100",    textColor: "text-red-700",    description: "피로·스트레스 시 단기기억 용량이 줄어들 수 있어요." };
}

// NRS Pain — Downie et al. (1978); Farrar et al. PAIN 94(1-2):149-158 (2001)
// Severity cutoffs: Serlin et al. (1995) — 1-4 mild, 5-6 moderate, 7-10 severe
export function getPainStatus(score: number): ScoreStatus {
  if (score === 0)
    return { level: "good",   label: "통증 없음",   color: "bg-green-100",  textColor: "text-green-700",  description: "통증이 없는 상태예요." };
  if (score <= 4)
    return { level: "good",   label: "경미",   color: "bg-green-100",  textColor: "text-green-700",  description: "일상생활에 크게 지장이 없는 수준이에요." };
  if (score <= 6)
    return { level: "normal", label: "중등도",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "일상 활동에 영향을 줄 수 있어요. 지속 시 전문가 상담을 권장해요." };
  return   { level: "low",    label: "심함",   color: "bg-red-100",    textColor: "text-red-700",    description: "활동에 심각한 제한이 있는 수준이에요. 의료진과 상담하세요." };
}

// NRS Fatigue — Bruera et al. J Pain Symptom Manage (1991); NCCN Cancer-Related Fatigue Guidelines
// Cutoffs adapted for general population: 0-3 mild/none, 4-6 moderate, 7-10 severe
export function getFatigueStatus(score: number): ScoreStatus {
  if (score <= 3)
    return { level: "good",   label: "피로 없음",   color: "bg-green-100",  textColor: "text-green-700",  description: "피로도가 낮고 컨디션이 좋은 상태예요." };
  if (score <= 6)
    return { level: "normal", label: "중등도",   color: "bg-yellow-100", textColor: "text-yellow-700", description: "약간의 피로가 있어요. 수분 섭취와 짧은 휴식이 도움돼요." };
  return   { level: "low",    label: "심한 피로",   color: "bg-red-100",    textColor: "text-red-700",    description: "피로도가 높아요. 오늘은 강도 낮은 회복 운동과 충분한 수면을 우선하세요." };
}

/** 개인 평균 대비 변화율 */
export function calcTrend(current: number, personalAvg: number, higherIsBetter: boolean) {
  if (personalAvg === 0) return null;
  const changePct = Math.round(((current - personalAvg) / personalAvg) * 100);
  const improved = higherIsBetter ? changePct > 0 : changePct < 0;
  return { changePct: Math.abs(changePct), improved, direction: changePct > 0 ? "↑" : changePct < 0 ? "↓" : "—" };
}
