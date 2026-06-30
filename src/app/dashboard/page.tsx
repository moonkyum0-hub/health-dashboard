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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeRoleMetric, ROLE_LABEL, type UserRole } from "@/lib/roleMetrics";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await ensureCatalogSeeded();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = user?.role as UserRole | null;

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
      <h1 className="mb-6 text-xl font-display font-semibold">대시보드</h1>

      {!role && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-blue-800">
                사용 목적을 설정하면 나에게 맞는 핵심 지표를 보여드려요.
              </p>
              <Button size="sm" className="shrink-0 rounded-full" render={<Link href="/settings" />}>
                목적 설정하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400">
          기록이 쌓이면 여기에서 추세와 맞춤 추천을 확인할 수 있습니다.
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
                  {roleMetric.items.map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-100 p-3">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold">
                        {item.later != null ? Math.round(item.later * 10) / 10 : "-"}
                        <span className="ml-1 text-xs font-normal text-slate-400">{item.unit}</span>
                      </p>
                      {item.changePercent != null && (
                        <p
                          className={`mt-1 text-xs font-medium ${
                            item.improved ? "text-blue-600" : "text-red-500"
                          }`}
                        >
                          {item.changePercent > 0 ? "▲" : item.changePercent < 0 ? "▼" : "–"}{" "}
                          {Math.abs(item.changePercent)}% (이전 기록 대비)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  최근 기록 {roleMetric.sampleSize}건을 절반으로 나누어 비교한 값으로, 입력하신 데이터에서 자동으로 계산됩니다.
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
                {insights.map((insight) => (
                  <div key={insight.key} className="rounded-xl bg-blue-50 p-4">
                    <p className="font-medium">{insight.title}</p>
                    <p className="mt-1 text-sm text-slate-600 break-words">{insight.detail}</p>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      <p className="break-words">
                        <span className="font-medium text-slate-700">생활 습관: </span>
                        <span className="text-slate-600">{insight.lifestyleTip}</span>
                      </p>
                      <p className="break-words">
                        <span className="font-medium text-slate-700">식습관: </span>
                        <span className="text-slate-600">{insight.dietTip}</span>
                      </p>
                    </div>
                  </div>
                ))}
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

          <Card>
            <CardHeader>
              <CardTitle>시간에 따른 변화</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length < 2 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  기록이 2건 이상 쌓이면 변화 추이 그래프가 표시돼요.
                </p>
              ) : (
                <TrendLineChart data={trendData} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>부위별 운동 완수율</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  운동 기록을 남기면 부위별 완수율이 표시돼요.
                </p>
              ) : (
                <RegionBarChart data={regionData} />
              )}
            </CardContent>
          </Card>

          <AiFeedbackPanel
            endpoint="/api/feedback/weekly"
            body={{}}
            title="AI 주간 건강 분석 (최근 7일)"
          />
          <AiFeedbackPanel
            endpoint="/api/feedback/region"
            body={{}}
            title="AI 부위별 진행도 평가"
          />
          <AiFeedbackPanel
            endpoint="/api/feedback/correlation"
            body={{}}
            title="AI 운동-학습 집중도 상관관계 분석"
          />
        </div>
      )}
    </div>
  );
}
