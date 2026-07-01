export function calcStreak(logDates: Date[]): number {
  if (logDates.length === 0) return 0;

  const toDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const today = toDay(new Date());
  const daySet = new Set(logDates.map(toDay));

  let streak = 0;
  let cursor = today;

  // today가 기록되지 않았으면 어제부터 체크
  if (!daySet.has(cursor)) cursor -= 86400000;

  while (daySet.has(cursor)) {
    streak++;
    cursor -= 86400000;
  }

  return streak;
}

export function getWeekDays(): Date[] {
  const today = new Date();
  const dow = today.getDay(); // 0=일
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
