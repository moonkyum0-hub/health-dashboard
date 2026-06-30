import { CATEGORY_LABEL, type ExerciseCategory } from "@/lib/exerciseCatalog";

export interface InsightInput {
  date: Date;
  sleepHours: number | null;
  energyMorning: number | null;
  energyAfternoon: number | null;
  energyEvening: number | null;
  studyFocusScore: number | null;
  exercises: { region: string; completed: boolean; pain: boolean }[];
}

export interface Insight {
  key: string;
  title: string;
  detail: string;
  recommendedCategories: ExerciseCategory[];
  lifestyleTip: string;
  dietTip: string;
}

function average(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

export function analyzeLogs(logs: InsightInput[]): Insight[] {
  const recent = logs.slice(-14);
  if (recent.length === 0) return [];

  const insights: Insight[] = [];

  const sleepAvg = average(
    recent.map((l) => l.sleepHours).filter((v): v is number => v != null)
  );
  if (sleepAvg != null && sleepAvg < 6) {
    insights.push({
      key: "sleep",
      title: "수면 부족 경향이 보여요",
      detail: `최근 평균 수면 시간이 ${sleepAvg.toFixed(1)}시간으로 권장 수준(7시간)보다 부족합니다.`,
      recommendedCategories: ["FLEXIBILITY"],
      lifestyleTip: "취침 1시간 전 스마트폰 사용을 줄이고, 동일한 시간에 잠자리에 드는 습관을 만들어보세요.",
      dietTip: "저녁에는 카페인과 과식을 피하고, 따뜻한 차나 가벼운 견과류 정도로 마무리하세요.",
    });
  }

  const energyValues = recent.flatMap((l) =>
    [l.energyMorning, l.energyAfternoon, l.energyEvening].filter(
      (v): v is number => v != null
    )
  );
  const energyAvg = average(energyValues);
  if (energyAvg != null && energyAvg < 5) {
    insights.push({
      key: "energy",
      title: "전반적인 에너지 저하가 보여요",
      detail: `최근 평균 에너지 레벨이 ${energyAvg.toFixed(1)}/10으로 낮은 편입니다.`,
      recommendedCategories: ["CARDIO", "LOWER"],
      lifestyleTip: "짧은 산책이나 계단 오르기처럼 가벼운 움직임을 자주 끼워 넣어 혈류를 촉진해보세요.",
      dietTip: "정제 탄수화물 위주의 식사보다 단백질·복합 탄수화물을 함께 섭취해 혈당 급변을 줄이세요.",
    });
  }

  const focusValues = recent
    .map((l) => l.studyFocusScore)
    .filter((v): v is number => v != null);
  const focusAvg = average(focusValues);
  if (focusAvg != null && focusAvg < 5) {
    insights.push({
      key: "focus",
      title: "학습 집중도가 낮은 편이에요",
      detail: `최근 평균 집중도가 ${focusAvg.toFixed(1)}/10입니다.`,
      recommendedCategories: ["CARDIO"],
      lifestyleTip: "50분 집중 후 5분은 자리에서 일어나 가볍게 움직이는 식으로 리듬을 만들어보세요.",
      dietTip: "당 함량이 높은 간식 대신 견과류·과일처럼 혈당을 천천히 올리는 간식을 선택하세요.",
    });
  }

  const allExercises = recent.flatMap((l) => l.exercises);
  const painByRegion = new Map<string, number>();
  for (const ex of allExercises) {
    if (ex.pain) painByRegion.set(ex.region, (painByRegion.get(ex.region) ?? 0) + 1);
  }
  for (const [region, count] of painByRegion) {
    if (count >= 2) {
      const regionLabel = CATEGORY_LABEL[region as ExerciseCategory] ?? region;
      insights.push({
        key: `pain-${region}`,
        title: `${regionLabel} 부위 통증이 반복되고 있어요`,
        detail: `최근 기록에서 해당 부위 운동 중 통증이 ${count}회 보고되었습니다.`,
        recommendedCategories: ["FLEXIBILITY"],
        lifestyleTip: "통증이 있는 부위는 강도를 낮추고, 폼롤러 릴리즈 등 회복 위주 운동으로 전환해보세요.",
        dietTip: "염증 완화에 도움이 되는 충분한 수분 섭취와 오메가-3가 풍부한 식품을 고려해보세요.",
      });
    }
  }

  if (allExercises.length > 0) {
    const completionRate =
      allExercises.filter((e) => e.completed).length / allExercises.length;
    if (completionRate < 0.5) {
      insights.push({
        key: "completion",
        title: "운동 완수율이 낮아지고 있어요",
        detail: `최근 운동 완수율이 ${Math.round(completionRate * 100)}%입니다.`,
        recommendedCategories: ["CORE", "FLEXIBILITY"],
        lifestyleTip: "운동 시간을 줄이거나 난이도를 낮춰서, 끝까지 완수하는 경험을 먼저 쌓아보세요.",
        dietTip: "운동 전 가벼운 탄수화물 섭취로 에너지를 확보하면 완수율을 높이는 데 도움이 됩니다.",
      });
    }
  }

  return insights;
}
