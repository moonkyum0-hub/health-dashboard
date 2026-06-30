import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABEL, type ExerciseCategory } from "@/lib/exerciseCatalog";
import AiFeedbackPanel from "@/components/AiFeedbackPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-xl font-display font-semibold">
        {log.date.toISOString().slice(0, 10)} ({log.dayOfWeek})
      </h1>
      <p className="mb-6 text-sm text-slate-400">{log.routine}</p>

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
