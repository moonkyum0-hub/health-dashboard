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

/** 개인 평균 대비 변화율 */
export function calcTrend(current: number, personalAvg: number, higherIsBetter: boolean) {
  if (personalAvg === 0) return null;
  const changePct = Math.round(((current - personalAvg) / personalAvg) * 100);
  const improved = higherIsBetter ? changePct > 0 : changePct < 0;
  return { changePct: Math.abs(changePct), improved, direction: changePct > 0 ? "↑" : changePct < 0 ? "↓" : "—" };
}
