export type UserRole = "STUDENT" | "WORKER" | "ATHLETE" | "PATIENT" | "GENERAL";

export const ROLE_LABEL: Record<UserRole, string> = {
  STUDENT: "학생",
  WORKER: "직장인",
  ATHLETE: "운동선수",
  PATIENT: "환자 · 재활",
  GENERAL: "기타",
};

export const ROLE_METRIC_LABEL: Record<UserRole, string> = {
  STUDENT: "학습 효능",
  WORKER: "업무 효율",
  ATHLETE: "운동 기능 향상",
  PATIENT: "건강 기능 향상",
  GENERAL: "종합 건강 지표",
};

export const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "STUDENT", label: "학생", description: "학습 효능을 중심으로 분석합니다." },
  { value: "WORKER", label: "직장인", description: "업무 효율을 중심으로 분석합니다." },
  { value: "ATHLETE", label: "운동선수", description: "운동 기능 향상을 중심으로 분석합니다." },
  { value: "PATIENT", label: "환자 · 재활", description: "건강 기능 회복을 중심으로 분석합니다." },
  { value: "GENERAL", label: "기타", description: "종합적인 건강 지표를 확인합니다." },
];

export interface RoleMetricInput {
  date: Date;
  sleepHours: number | null;
  energyMorning: number | null;
  energyAfternoon: number | null;
  energyEvening: number | null;
  studyFocusScore: number | null;
  studyFocusMinutes: number | null;
  reactionTimeMs: number | null;
  totalExerciseMin: number | null;
  exercises: { completed: boolean; pain: boolean }[];
}

export interface MetricItem {
  label: string;
  unit: string;
  earlier: number | null;
  later: number | null;
  changePercent: number | null;
  improved: boolean | null;
}

export interface RoleMetricResult {
  metricLabel: string;
  items: MetricItem[];
  sampleSize: number;
}

function avg(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function splitHalves<T>(arr: T[]): [T[], T[]] {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

function buildItem(
  label: string,
  unit: string,
  earlierVals: number[],
  laterVals: number[],
  higherIsBetter: boolean
): MetricItem {
  const earlier = avg(earlierVals);
  const later = avg(laterVals);
  let changePercent: number | null = null;
  let improved: boolean | null = null;
  if (earlier != null && later != null && earlier !== 0) {
    changePercent = Math.round(((later - earlier) / Math.abs(earlier)) * 1000) / 10;
    improved = higherIsBetter ? later >= earlier : later <= earlier;
  }
  return { label, unit, earlier, later, changePercent, improved };
}

export function computeRoleMetric(
  role: UserRole,
  logs: RoleMetricInput[]
): RoleMetricResult | null {
  if (logs.length === 0) return null;

  const sorted = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const [earlierLogs, laterLogs] = splitHalves(sorted);

  const pick = (rows: RoleMetricInput[], selector: (l: RoleMetricInput) => number | null) =>
    rows.map(selector).filter((v): v is number => v != null);

  const energyAvgPerLog = (rows: RoleMetricInput[]) =>
    rows
      .map((l) =>
        avg(
          [l.energyMorning, l.energyAfternoon, l.energyEvening].filter(
            (v): v is number => v != null
          )
        )
      )
      .filter((v): v is number => v != null);

  const completionRate = (rows: RoleMetricInput[]) => {
    const all = rows.flatMap((r) => r.exercises);
    return all.length
      ? [Math.round((all.filter((e) => e.completed).length / all.length) * 1000) / 10]
      : [];
  };

  const painRate = (rows: RoleMetricInput[]) => {
    const all = rows.flatMap((r) => r.exercises);
    return all.length
      ? [Math.round((all.filter((e) => e.pain).length / all.length) * 1000) / 10]
      : [];
  };

  let items: MetricItem[];

  if (role === "STUDENT" || role === "WORKER") {
    const minutesLabel = role === "STUDENT" ? "학습 집중 시간" : "업무 집중 시간";
    items = [
      buildItem(
        "반응속도(객관적 각성도)",
        "ms",
        pick(earlierLogs, (l) => l.reactionTimeMs),
        pick(laterLogs, (l) => l.reactionTimeMs),
        false
      ),
      buildItem(
        minutesLabel,
        "분",
        pick(earlierLogs, (l) => l.studyFocusMinutes),
        pick(laterLogs, (l) => l.studyFocusMinutes),
        true
      ),
      buildItem(
        "자가 평가 집중도",
        "/10",
        pick(earlierLogs, (l) => l.studyFocusScore),
        pick(laterLogs, (l) => l.studyFocusScore),
        true
      ),
    ];
  } else if (role === "ATHLETE") {
    items = [
      buildItem("운동 완수율", "%", completionRate(earlierLogs), completionRate(laterLogs), true),
      buildItem(
        "총 운동 시간",
        "분",
        pick(earlierLogs, (l) => l.totalExerciseMin),
        pick(laterLogs, (l) => l.totalExerciseMin),
        true
      ),
    ];
  } else if (role === "PATIENT") {
    items = [
      buildItem(
        "평균 수면 시간",
        "h",
        pick(earlierLogs, (l) => l.sleepHours),
        pick(laterLogs, (l) => l.sleepHours),
        true
      ),
      buildItem("평균 에너지", "/10", energyAvgPerLog(earlierLogs), energyAvgPerLog(laterLogs), true),
      buildItem(
        "운동 중 통증 발생률",
        "%",
        painRate(earlierLogs),
        painRate(laterLogs),
        false
      ),
    ];
  } else {
    items = [
      buildItem(
        "평균 수면 시간",
        "h",
        pick(earlierLogs, (l) => l.sleepHours),
        pick(laterLogs, (l) => l.sleepHours),
        true
      ),
      buildItem("평균 에너지", "/10", energyAvgPerLog(earlierLogs), energyAvgPerLog(laterLogs), true),
      buildItem(
        "총 운동 시간",
        "분",
        pick(earlierLogs, (l) => l.totalExerciseMin),
        pick(laterLogs, (l) => l.totalExerciseMin),
        true
      ),
    ];
  }

  return {
    metricLabel: ROLE_METRIC_LABEL[role],
    items,
    sampleSize: sorted.length,
  };
}
