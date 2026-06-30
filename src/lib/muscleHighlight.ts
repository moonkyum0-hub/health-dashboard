export type BodySegment = "trunk" | "arm" | "thigh" | "shank";

// Which body segment(s) carry the primary working muscle for each catalog
// exercise, grounded in the muscle named in that exercise's `benefit` text
// (e.g. quadriceps/glutes -> thigh, gastrocnemius -> shank, rectus
// abdominis/erector spinae -> trunk, rear delt/rhomboids -> arm). Used to
// highlight the segment actually doing the work, instead of a blanket
// per-category color.
export const MUSCLE_HIGHLIGHT: Record<string, BodySegment[]> = {
  "플랭크": ["trunk"],
  "브릿지": ["thigh"],
  "데드버그": ["trunk", "thigh"],
  "Y-W-T 교정 운동": ["arm", "trunk"],
  "밴드 풀 어파트": ["arm"],
  "무릎 푸쉬업": ["arm"],
  "맨몸 스쿼트": ["thigh"],
  "런지": ["thigh"],
  "카프레이즈": ["shank"],
  "고양이-소 자세": ["trunk"],
  "폼롤러 릴리즈": ["thigh"],
  "목/어깨 가동성 운동": ["trunk", "arm"],
  "슬로우 버피": ["trunk", "thigh", "arm"],
  "마운틴 클라이머": ["trunk", "thigh"],
  "제자리 걷기 / 계단 오르기": ["thigh", "shank"],
  "러닝": ["thigh", "shank"],
  "심호흡 및 명상": [],
};
