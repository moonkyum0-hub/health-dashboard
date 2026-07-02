import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABEL, type ExerciseCategory } from "@/lib/exerciseCatalog";
import AiFeedbackPanel from "@/components/AiFeedbackPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calcStreak } from "@/lib/streak";
import LogActions from "./LogActions";
import {
  getReactionTimeStatus,
  getStroopAccuracyStatus,
  getBalanceStatus,
  getDigitSpanStatus,
  getPainStatus,
  getFatigueStatus,
} from "@/lib/scoreStatus";

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
        <div className="space-y-3">
          {/* ── 수면 ── */}
          {(log.sleepHours || log.sleepQuality || log.bedTime || log.wakeTime) && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">수면</p>
                <div className="flex flex-wrap items-end gap-6">
                  {log.sleepHours != null && (
                    <div>
                      <span className="text-4xl font-bold text-slate-800">{log.sleepHours}</span>
                      <span className="ml-1 text-lg text-slate-400">h</span>
                    </div>
                  )}
                  {log.sleepQuality != null && (
                    <div>
                      <p className="mb-1 text-xs text-slate-400">수면 질</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`h-2.5 w-2.5 rounded-sm ${
                              i < log.sleepQuality!
                                ? log.sleepQuality! >= 7 ? "bg-green-400" : log.sleepQuality! >= 4 ? "bg-yellow-400" : "bg-red-400"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{log.sleepQuality}/10</p>
                    </div>
                  )}
                  <div className="ml-auto text-right text-xs text-slate-400">
                    {log.bedTime && <p>취침 <span className="font-medium text-slate-600">{log.bedTime}</span></p>}
                    {log.wakeTime && <p>기상 <span className="font-medium text-slate-600">{log.wakeTime}</span></p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 에너지 & 집중 ── */}
          {(log.energyMorning || log.energyAfternoon || log.energyEvening || log.studyFocusScore) && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">에너지 &amp; 집중</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {([
                    { label: "오전", value: log.energyMorning },
                    { label: "오후", value: log.energyAfternoon },
                    { label: "저녁", value: log.energyEvening },
                    { label: "집중도", value: log.studyFocusScore },
                  ] as const).map(({ label, value }) =>
                    value != null ? (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white ${
                            value >= 7 ? "bg-green-500" : value >= 4 ? "bg-yellow-400" : "bg-red-400"
                          }`}
                        >
                          {value}
                        </div>
                        <p className="text-xs text-slate-400">{label}</p>
                      </div>
                    ) : null
                  )}
                  {log.studyFocusMinutes != null && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600">
                        {log.studyFocusMinutes}
                        <span className="text-xs font-normal">분</span>
                      </div>
                      <p className="text-xs text-slate-400">집중 시간</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 객관적 측정 ── */}
          {(log.reactionTimeMs || log.stroopAccuracy != null || log.balanceSec != null ||
            log.digitSpan != null || log.painScore != null || log.fatigueScore != null) && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">객관적 측정</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {log.reactionTimeMs != null && (() => {
                    const s = getReactionTimeStatus(log.reactionTimeMs);
                    return (
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <p className="text-xl font-bold text-slate-800">{Math.round(log.reactionTimeMs)}ms</p>
                        <p className={`text-xs font-medium ${s.textColor}`}>{s.label}</p>
                        <p className="text-xs text-slate-500">반응속도</p>
                      </div>
                    );
                  })()}
                  {log.balanceSec != null && (() => {
                    const s = getBalanceStatus(log.balanceSec);
                    return (
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <p className="text-xl font-bold text-slate-800">{log.balanceSec}초</p>
                        <p className={`text-xs font-medium ${s.textColor}`}>{s.label}</p>
                        <p className="text-xs text-slate-500">균형</p>
                      </div>
                    );
                  })()}
                  {log.stroopAccuracy != null && (() => {
                    const s = getStroopAccuracyStatus(log.stroopAccuracy);
                    return (
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <p className="text-xl font-bold text-slate-800">{log.stroopAccuracy}%</p>
                        <p className={`text-xs font-medium ${s.textColor}`}>{s.label}</p>
                        <p className="text-xs text-slate-500">스트룹 정확도</p>
                      </div>
                    );
                  })()}
                  {log.digitSpan != null && (() => {
                    const s = getDigitSpanStatus(log.digitSpan);
                    return (
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <p className="text-xl font-bold text-slate-800">{log.digitSpan}자리</p>
                        <p className={`text-xs font-medium ${s.textColor}`}>{s.label}</p>
                        <p className="text-xs text-slate-500">숫자 기억</p>
                      </div>
                    );
                  })()}
                  {log.painScore != null && (() => {
                    const s = getPainStatus(log.painScore);
                    return (
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <p className="text-xl font-bold text-slate-800">{log.painScore}/10</p>
                        <p className={`text-xs font-medium ${s.textColor}`}>{s.label}</p>
                        <p className="text-xs text-slate-500">통증</p>
                      </div>
                    );
                  })()}
                  {log.fatigueScore != null && (() => {
                    const s = getFatigueStatus(log.fatigueScore);
                    return (
                      <div className={`rounded-xl p-3 ${s.color}`}>
                        <p className="text-xl font-bold text-slate-800">{log.fatigueScore}/10</p>
                        <p className={`text-xs font-medium ${s.textColor}`}>{s.label}</p>
                        <p className="text-xs text-slate-500">피로도</p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 활동 요약 ── */}
          {(log.totalExerciseMin || log.overallRPE) && (
            <Card>
              <CardContent className="pt-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">활동 요약</p>
                <div className="flex gap-6">
                  {log.totalExerciseMin != null && (
                    <div>
                      <span className="text-4xl font-bold text-slate-800">{log.totalExerciseMin}</span>
                      <span className="ml-1 text-lg text-slate-400">분</span>
                      <p className="text-xs text-slate-400">총 운동</p>
                    </div>
                  )}
                  {log.overallRPE != null && (
                    <div>
                      <span className="text-4xl font-bold text-slate-800">{log.overallRPE}</span>
                      <span className="ml-1 text-lg text-slate-400">/10</span>
                      <p className="text-xs text-slate-400">전체 RPE</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
