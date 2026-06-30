export const CARD_CATEGORIES = ["수면", "운동", "영양", "재활", "멘탈 헬스", "기타"] as const;
export type CardCategory = (typeof CARD_CATEGORIES)[number];
