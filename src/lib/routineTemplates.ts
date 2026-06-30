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
    name: "아침잠 깨우기 루틴",
    description: "일어나자마자 몸에 가볍게 시동을 거는 짧은 루틴입니다. 혈류를 돌려 각성도를 높여줍니다.",
    days: [1, 2, 3, 4, 5],
    exerciseNames: ["목/어깨 가동성 운동", "맨몸 스쿼트", "카프레이즈", "제자리 걷기 / 계단 오르기"],
  },
  {
    id: "desk-stretch",
    name: "책상 앞 간단 스트레칭",
    description: "오래 앉아 공부하거나 일하는 사이사이, 자리에서 바로 할 수 있는 짧은 이완 루틴입니다.",
    days: [],
    exerciseNames: ["목/어깨 가동성 운동", "고양이-소 자세", "Y-W-T 교정 운동", "심호흡 및 명상"],
  },
  {
    id: "core-strength",
    name: "코어 강화 루틴",
    description: "체간 안정성을 길러 자세 유지력과 허리 부담 완화에 도움을 주는 루틴입니다.",
    days: [2, 4],
    exerciseNames: ["플랭크", "브릿지", "데드버그"],
  },
  {
    id: "lower-body",
    name: "하체 강화 루틴",
    description: "대퇴사두근·둔근 위주로 하체 기초 근력을 기르는 루틴입니다.",
    days: [1, 3, 5],
    exerciseNames: ["맨몸 스쿼트", "런지", "카프레이즈"],
  },
  {
    id: "cardio-circulation",
    name: "유산소 순환 루틴",
    description: "심박수를 끌어올려 혈액순환과 컨디션 개선에 도움을 주는 루틴입니다.",
    days: [],
    exerciseNames: ["슬로우 버피", "마운틴 클라이머", "제자리 걷기 / 계단 오르기"],
  },
  {
    id: "pre-sleep",
    name: "취침 전 이완 루틴",
    description: "잠들기 전 몸과 마음을 천천히 가라앉히는 저강도 이완 루틴입니다.",
    days: [],
    exerciseNames: ["고양이-소 자세", "폼롤러 릴리즈", "심호흡 및 명상"],
  },
];
