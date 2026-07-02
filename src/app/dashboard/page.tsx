import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/seedCatalog";
import { CATEGORY_LABEL, CATEGORY_ORDER, type ExerciseCategory } from "@/lib/exerciseCatalog";
import { analyzeLogs } from "@/lib/recommend";
import { TrendLineChart, RegionBarChart, type TrendPoint } from "@/components/TrendCharts";
import CategoryIcon from "@/components/icons/CategoryIcon";
import AiFeedbackPanel from "@/components/AiFeedbackPanel";
import CollapsibleAI from "@/components/CollapsibleAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeRoleMetric, ROLE_LABEL, type UserRole } from "@/lib/roleMetrics";
import { calcStreak } from "@/lib/streak";
import StreakWidget from "@/components/StreakWidget";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await ensureCatalogSeeded();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = user?.role as UserRole | null;

  if (!user?.onboardingDone) {
    redirect("/onboarding");
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
    include: { exercises: true },
  });

  const roleMetric = role
    ? computeRoleMetric(
        role,
        logs.map((l) => ({
          date: l.date,
          sleepHours: l.sleepHours,
          energyMorning: l.energyMorning,
          energyAfternoon: l.energyAfternoon,
          energyEvening: l.energyEvening,
          studyFocusScore: l.studyFocusScore,
          studyFocusMinutes: l.studyFocusMinutes,
          reactionTimeMs: l.reactionTimeMs,
          totalExerciseMin: l.totalExerciseMin,
          exercises: l.exercises.map((e) => ({ completed: e.completed, pain: e.pain })),
        }))
      )
    : null;

  // Today's log check
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasTodayLog = logs.some((l) => l.date.toISOString().slice(0, 10) === todayStr);

  // Latest log for hero card
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const latestEnergies = latestLog
    ? [latestLog.energyMorning, latestLog.energyAfternoon, latestLog.energyEvening].filter(
        (v): v is number => v != null
      )
    : [];
  const latestEnergyAvg =
    latestEnergies.length > 0
      ? Math.round((latestEnergies.reduce((a, b) => a + b, 0) / latestEnergies.length) * 10) / 10
      : null;

  const streak = calcStreak(logs.map((l) => l.date));

  const trendData: TrendPoint[] = logs.map((l) => {
    const energies = [l.energyMorning, l.energyAfternoon, l.energyEvening].filter(
      (v): v is number => v != null
    );
    return {
      date: l.date.toISOString().slice(5, 10),
      sleepHours: l.sleepHours,
      overallRPE: l.overallRPE,
      studyFocusScore: l.studyFocusScore,
      energyAvg: energies.length
        ? Math.round((energies.reduce((a, b) => a + b, 0) / energies.length) * 10) / 10
        : null,
    };
  });

  const allExercises = logs.flatMap((l) => l.exercises);
  const regionData = CATEGORY_ORDER.map((region) => {
    const rows = allExercises.filter((e) => e.region === region);
    const completed = rows.filter((r) => r.completed).length;
    return {
      label: CATEGORY_LABEL[region],
      completionRate: rows.length ? Math.round((completed / rows.length) * 100) : 0,
    };
  });

  const insights = analyzeLogs(
    logs.map((l) => ({
      date: l.date,
      sleepHours: l.sleepHours,
      energyMorning: l.energyMorning,
      energyAfternoon: l.energyAfternoon,
      energyEvening: l.energyEvening,
      studyFocusScore: l.studyFocusScore,
      exercises: l.exercises.map((e) => ({
        region: e.region,
        completed: e.completed,
        pain: e.pain,
      })),
    }))
  );

  const recommendedCategories = Array.from(
    new Set(insights.flatMap((i) => i.recommendedCategories))
  );
  const recommendedExercises = recommendedCategories.length
    ? await prisma.exerciseCatalog.findMany({
        where: { category: { in: recommendedCategories } },
        take: 6,
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900">
          {user?.name ? `${user.name}님의 ` : ""}건강 대시보드
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          총 {logs.length}일 기록됨{streak > 0 ? ` · ${streak}일 연속 중` : ""}
        </p>
      </div>

      {logs.length < 3 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50 p-5">
          <p className="mb-3 text-sm font-semibold text-blue-800">
            {logs.length === 0 ? "시작해볼까요?" : `${logs.length}번 기록했어요! 계속 이어가봐요.`}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { done: true, label: "계정 만들기", href: null },
              { done: logs.length > 0, label: "첫 기록 작성하기", href: "/log/new" },
              { done: logs.length >= 3, label: "3일 연속 기록하기", href: "/log/new" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  item.done
                    ? "bg-blue-500 text-white"
                    : "border border-sky-200 bg-white text-blue-700"
                }`}
              >
                <span className={`text-base ${item.done ? "text-white" : "text-blue-400"}`}>
                  {item.done ? "✓" : "○"}
                </span>
                {item.href && !item.done ? (
                  <Link href={item.href} className="hover:underline">{item.label}</Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-blue-600">
            막히는 게 있으면{" "}
            <Link href="/onboarding" className="underline hover:text-blue-800">온보딩 가이드</Link>를 다시 볼 수 있어요.
          </p>
        </div>
      )}

      {/* 오늘 기록 없음 배너 */}
      {!hasTodayLog && logs.length >= 3 && (
        <Link
          href="/log/new"
          className="mb-6 flex items-center justify-between rounded-2xl bg-blue-600 px-5 py-4 text-white hover:bg-blue-700"
        >
          <div>
            <p className="text-sm font-semibold">오늘 아직 기록하지 않았어요</p>
            <p className="text-xs text-blue-200 mt-0.5">기록하면 대시보드가 업데이트돼요</p>
          </div>
          <span className="shrink-0 text-sm font-bold">기록하기 →</span>
        </Link>
      )}

      {/* 최근 기록 히어로 카드 */}
      {latestLog && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-sky-500 p-5 text-white shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-blue-100">최근 기록</p>
              <p className="text-xs text-sky-300">
                {latestLog.date.toISOString().slice(0, 10)} ({latestLog.dayOfWeek})
              </p>
            </div>
            <Link
              href={`/logs/${latestLog.id}`}
              className="shrink-0 rounded-lg bg-white/15 px-3 py-1 text-xs font-medium text-white hover:bg-white/25"
            >
              상세보기
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {latestEnergyAvg !== null && (
              <div>
                <p className="text-2xl font-bold leading-none">{latestEnergyAvg}</p>
                <p className="mt-1 text-xs text-sky-200">에너지 /10</p>
              </div>
            )}
            {latestLog.sleepHours !== null && (
              <div>
                <p className="text-2xl font-bold leading-none">{latestLog.sleepHours}h</p>
                <p className="mt-1 text-xs text-sky-200">수면</p>
              </div>
            )}
            {(latestLog.totalExerciseMin ?? 0) > 0 && (
              <div>
                <p className="text-2xl font-bold leading-none">{latestLog.totalExerciseMin}</p>
                <p className="mt-1 text-xs text-sky-200">운동 분</p>
              </div>
            )}
            {latestLog.reactionTimeMs != null && (
              <div>
                <p className="text-2xl font-bold leading-none">{Math.round(latestLog.reactionTimeMs)}</p>
                <p className="mt-1 text-xs text-sky-200">반응속도 ms</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 스트릭 + 주간/월간 캘린더 */}
      <Card className="mb-6">
        <CardContent>
          <StreakWidget
            streak={streak}
            logDatesISO={logs.map((l) => l.date.toISOString())}
          />
        </CardContent>
      </Card>

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400">
          첫 기록을 작성하면 여기에서 추세와 맞춤 추천을 확인할 수 있습니다.
        </p>
      ) : (
        <div className="space-y-6">
          {role && roleMetric && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {ROLE_LABEL[role]} 맞춤 지표 · {roleMetric.metricLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {roleMetric.items.map((item) => {
                    const val = (item.later ?? item.earlier) != null
                      ? Math.round((item.later ?? item.earlier)! * 10) / 10
                      : null;
                    const borderColor =
                      item.changePercent != null
                        ? item.improved
                          ? "border-l-green-400"
                          : "border-l-red-400"
                        : "border-l-slate-200";
                    return (
                      <div
                        key={item.label}
                        className={`overflow-hidden rounded-xl border border-slate-100 border-l-4 ${borderColor} p-4`}
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold leading-none text-slate-800">
                          {val ?? "—"}
                          <span className="ml-1 text-sm font-normal text-slate-400">{item.unit}</span>
                        </p>
                        {item.changePercent != null && (
                          <p
                            className={`mt-2 text-sm font-semibold ${
                              item.improved ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {item.changePercent > 0 ? "▲" : item.changePercent < 0 ? "▼" : "–"}{" "}
                            {Math.abs(item.changePercent)}%
                            <span className="ml-1 text-xs font-normal text-slate-400">이전 대비</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {roleMetric.sampleSize < 2
                    ? "현재 기록 기준 값이에요. 기록이 2건 이상 쌓이면 전반·후반 비교와 변화율이 표시됩니다."
                    : `최근 기록 ${roleMetric.sampleSize}건을 절반으로 나누어 비교한 값으로, 입력하신 데이터에서 자동으로 계산됩니다.`}
                </p>
              </CardContent>
            </Card>
          )}

          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>맞춤 추천</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                {insights.map((insight, i) => {
                  const palettes = [
                    { bg: "bg-blue-50", border: "border-l-blue-400", title: "text-blue-800", dot: "bg-blue-400" },
                    { bg: "bg-blue-50",  border: "border-l-blue-400",  title: "text-blue-800",  dot: "bg-blue-400"  },
                    { bg: "bg-amber-50", border: "border-l-amber-400", title: "text-amber-800", dot: "bg-amber-400" },
                    { bg: "bg-purple-50",border: "border-l-purple-400",title: "text-purple-800",dot: "bg-purple-400"},
                  ];
                  const p = palettes[i % palettes.length];
                  return (
                    <div key={insight.key} className={`rounded-xl border-l-4 ${p.bg} ${p.border} p-4`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${p.dot}`} />
                        <div className="min-w-0">
                          <p className={`font-semibold ${p.title}`}>{insight.title}</p>
                          <p className="mt-1 text-sm text-slate-600 break-words">{insight.detail}</p>
                          <div className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                            <p className="break-words text-slate-600">
                              <span className="font-medium text-slate-700">생활 습관 </span>
                              {insight.lifestyleTip}
                            </p>
                            <p className="break-words text-slate-600">
                              <span className="font-medium text-slate-700">식습관 </span>
                              {insight.dietTip}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {recommendedExercises.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-slate-600">추천 운동</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {recommendedExercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
                      >
                        <CategoryIcon
                          category={ex.category as ExerciseCategory}
                          className="h-4 w-4 shrink-0 text-slate-300"
                        />
                        <span className="min-w-0 flex-1 truncate">{ex.name}</span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {CATEGORY_LABEL[ex.category as ExerciseCategory]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/routines/new"
                    className="mt-3 inline-block text-sm underline text-slate-600 hover:text-blue-600"
                  >
                    이 운동들로 루틴 만들기
                  </Link>
                </div>
              )}
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">추세</p>
              <h2 className="mt-0.5 text-base font-semibold text-slate-800">시간에 따른 변화</h2>
            </div>
            <CardContent className="pt-4">
              <TrendLineChart data={trendData} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">운동 분석</p>
              <h2 className="mt-0.5 text-base font-semibold text-slate-800">부위별 완수율</h2>
            </div>
            <CardContent className="pt-4">
              <RegionBarChart data={regionData} />
            </CardContent>
          </Card>

          <CollapsibleAI title="주간 건강 분석 (최근 7일)">
            <AiFeedbackPanel endpoint="/api/feedback/weekly" body={{}} title="AI 주간 건강 분석 (최근 7일)" />
          </CollapsibleAI>
          <CollapsibleAI title="부위별 운동 진행도">
            <AiFeedbackPanel endpoint="/api/feedback/region" body={{}} title="AI 부위별 진행도 평가" />
          </CollapsibleAI>
          <CollapsibleAI title="운동·집중도 상관관계">
            <AiFeedbackPanel endpoint="/api/feedback/correlation" body={{}} title="AI 운동-학습 집중도 상관관계 분석" />
          </CollapsibleAI>
        </div>
      )}
    </div>
  );
}
