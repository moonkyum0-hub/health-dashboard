export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  days: number[];
  exerciseNames: string[];
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: "morning-wake-up",
    name: "아침잠 깨우기",
    description: "기상 직후 혈류를 깨우는 10분",
    days: [1, 2, 3, 4, 5],
    exerciseNames: ["목/어깨 가동성 운동", "맨몸 스쿼트", "카프레이즈", "제자리 걷기 / 계단 오르기"],
  },
  {
    id: "desk-stretch",
    name: "책상 앞 스트레칭",
    description: "공부·업무 중 자리에서 바로",
    days: [],
    exerciseNames: ["목/어깨 가동성 운동", "고양이-소 자세", "Y-W-T 교정 운동", "심호흡 및 명상"],
  },
  {
    id: "core-strength",
    name: "코어 강화",
    description: "허리·체간 안정성 집중 강화",
    days: [2, 4],
    exerciseNames: ["플랭크", "브릿지", "데드버그"],
  },
  {
    id: "lower-body",
    name: "하체 강화",
    description: "대퇴·둔근 기초 근력 기르기",
    days: [1, 3, 5],
    exerciseNames: ["맨몸 스쿼트", "런지", "카프레이즈"],
  },
  {
    id: "cardio-circulation",
    name: "유산소 순환",
    description: "심박수를 올려 혈액순환 개선",
    days: [],
    exerciseNames: ["슬로우 버피", "마운틴 클라이머", "제자리 걷기 / 계단 오르기"],
  },
  {
    id: "pre-sleep",
    name: "취침 전 이완",
    description: "잠들기 전 몸과 마음 가라앉히기",
    days: [],
    exerciseNames: ["고양이-소 자세", "폼롤러 릴리즈", "심호흡 및 명상"],
  },
];
