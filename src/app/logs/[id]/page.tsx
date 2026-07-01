import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABEL, type ExerciseCategory } from "@/lib/exerciseCatalog";
import AiFeedbackPanel from "@/components/AiFeedbackPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calcStreak } from "@/lib/streak";
import LogActions from "./LogActions";

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: {
      exercises: true,
      meals: true,
      aiFeedbacks: { where: { type: "DAILY" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!log || log.userId !== session.user.id) {
    notFound();
  }

  const existingFeedback = log.aiFeedbacks[0]?.content ?? null;

  // 스트릭 계산
  const allLogs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    select: { date: true },
  });
  const streak = calcStreak(allLogs.map((l) => l.date));

  // 오늘 기록 여부
  const today = new Date();
  const isToday =
    log.date.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);

  // 에너지 평균
  const energyVals = [log.energyMorning, log.energyAfternoon, log.energyEvening].filter(
    (v): v is number => v != null
  );
  const energyAvg =
    energyVals.length > 0
      ? Math.round((energyVals.reduce((a, b) => a + b, 0) / energyVals.length) * 10) / 10
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

      {/* 완료 배너 */}
      {isToday && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">오늘 기록 완료! ✓</p>
              <p className="mt-0.5 text-sm text-blue-100">
                {[
                  energyAvg != null ? `에너지 평균 ${energyAvg}/10` : null,
                  log.exercises.length > 0 ? `운동 ${log.exercises.length}개` : null,
                  log.sleepHours ? `수면 ${log.sleepHours}h` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "오늘도 기록했어요"}
              </p>
            </div>
            {streak > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold">🔥 {streak}일</p>
                <p className="text-xs text-blue-200">연속 기록</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold">
            {log.date.toISOString().slice(0, 10)} ({log.dayOfWeek})
          </h1>
          <p className="text-sm text-slate-400">{log.routine}</p>
        </div>
        <LogActions logId={log.id} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="취침" value={log.bedTime} />
              <Stat label="기상" value={log.wakeTime} />
              <Stat label="수면 시간" value={log.sleepHours ? `${log.sleepHours}h` : null} />
              <Stat label="수면 질" value={log.sleepQuality} />
              <Stat label="오전 에너지" value={log.energyMorning} />
              <Stat label="오후 에너지" value={log.energyAfternoon} />
              <Stat label="저녁 에너지" value={log.energyEvening} />
              <Stat label="오전 집중도" value={log.studyFocusScore} />
              <Stat
                label="반응속도(객관적)"
                value={log.reactionTimeMs ? `${log.reactionTimeMs}ms` : null}
              />
              <Stat
                label="스트룹 정확도(객관적)"
                value={log.stroopAccuracy !== null ? `${log.stroopAccuracy}%` : null}
              />
              <Stat
                label="스트룹 평균반응(객관적)"
                value={log.stroopAvgMs ? `${log.stroopAvgMs}ms` : null}
              />
              <Stat
                label="균형 유지(객관적)"
                value={log.balanceSec !== null ? `${log.balanceSec}초` : null}
              />
              <Stat label="집중 지속(분)" value={log.studyFocusMinutes} />
              <Stat label="총 운동(분)" value={log.totalExerciseMin} />
              <Stat label="전체 RPE" value={log.overallRPE} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수행 운동</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {log.exercises.map((ex) => (
                <li key={ex.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{ex.name}</span>
                    <Badge variant="secondary">
                      {CATEGORY_LABEL[ex.region as ExerciseCategory] ?? ex.region}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    {ex.durationMin != null && <span>{ex.durationMin}분</span>}
                    {ex.setsReps && <span>{ex.setsReps}</span>}
                    {ex.rpe != null && <span>RPE {ex.rpe}</span>}
                    <span>{ex.completed ? "완수" : "미완수"}</span>
                    {ex.pain && <span className="text-red-500">통증 있음</span>}
                  </div>
                  {ex.notes && <p className="mt-1 text-slate-600 break-words">{ex.notes}</p>}
                </li>
              ))}
              {log.exercises.length === 0 && (
                <p className="text-sm text-slate-400">기록된 운동이 없습니다.</p>
              )}
            </ul>
            {log.exerciseNotes && (
              <p className="mt-3 text-sm text-slate-600 break-words">📝 {log.exerciseNotes}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>식단</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {log.meals.map((meal) => (
                <li key={meal.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{meal.mealType}</span>
                    <span className="shrink-0 text-xs text-slate-400">{meal.time}</span>
                  </div>
                  <p className="mt-1 break-words text-slate-600">{meal.items}</p>
                  {meal.notes && <p className="text-xs text-slate-400 break-words">{meal.notes}</p>}
                </li>
              ))}
              {log.meals.length === 0 && (
                <p className="text-sm text-slate-400">기록된 식사가 없습니다.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <AiFeedbackPanel
          endpoint="/api/feedback/daily"
          body={{ dailyLogId: log.id }}
          initialContent={existingFeedback}
          title="AI 임상 피드백 (일일 운동 평가)"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="truncate font-medium">{value ?? "-"}</dd>
    </div>
  );
}
