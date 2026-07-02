import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { exercises: true },
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const hasTodayLog = logs.some((l) => l.date.toISOString().slice(0, 10) === todayStr);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">기록 목록</h1>
          <p className="mt-0.5 text-sm text-slate-500">총 {logs.length}일 기록됨</p>
        </div>
        <Button className="rounded-full" render={<Link href="/log/new" />}>
          + 새 기록
        </Button>
      </div>

      {/* 오늘 기록 없을 때 */}
      {!hasTodayLog && logs.length > 0 && (
        <Link
          href="/log/new"
          className="mb-5 flex items-center justify-between rounded-2xl bg-blue-600 px-5 py-4 text-white hover:bg-blue-700"
        >
          <div>
            <p className="text-sm font-semibold">오늘 아직 기록하지 않았어요</p>
            <p className="text-xs text-blue-200 mt-0.5">기록하면 대시보드가 업데이트돼요</p>
          </div>
          <span className="text-sm font-bold">지금 기록하기 →</span>
        </Link>
      )}

      {logs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
          <p className="text-slate-500">아직 기록이 없어요.</p>
          <Link href="/log/new" className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            첫 기록 작성하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => {
            const isToday = log.date.toISOString().slice(0, 10) === todayStr;
            const energies = [log.energyMorning, log.energyAfternoon, log.energyEvening].filter(
              (v): v is number => v != null
            );
            const energyAvg =
              energies.length > 0
                ? Math.round((energies.reduce((a, b) => a + b, 0) / energies.length) * 10) / 10
                : null;
            const energyColor =
              energyAvg == null ? "bg-slate-200 text-slate-400"
              : energyAvg >= 7 ? "bg-green-500 text-white"
              : energyAvg >= 4 ? "bg-yellow-400 text-white"
              : "bg-red-400 text-white";

            const completed = log.exercises.filter((e) => e.completed).length;
            const total = log.exercises.length;

            return (
              <li key={log.id}>
                <Link href={`/logs/${log.id}`} className="block">
                  <div className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50 ${isToday ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-100"}`}>
                    {/* 에너지 컬러 인디케이터 */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${energyColor}`}>
                      {energyAvg != null ? energyAvg.toFixed(1) : "—"}
                    </div>

                    {/* 날짜 + 정보 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {log.date.toISOString().slice(5, 10).replace("-", "/")} ({log.dayOfWeek})
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            오늘
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-slate-400">
                        {log.sleepHours != null && <span>수면 {log.sleepHours}h</span>}
                        {total > 0 && <span>운동 {completed}/{total}개</span>}
                        {log.overallRPE != null && <span>RPE {log.overallRPE}</span>}
                        {log.reactionTimeMs != null && <span>반응 {Math.round(log.reactionTimeMs)}ms</span>}
                      </div>
                    </div>

                    {/* 루틴 */}
                    <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {log.routine}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
