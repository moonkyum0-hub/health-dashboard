import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/seedCatalog";
import LogForm from "@/components/LogForm";
import type { ExerciseCategory } from "@/lib/exerciseCatalog";

export default async function EditLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  await ensureCatalogSeeded();

  const [log, routines, catalog, recentLogs, user] = await Promise.all([
    prisma.dailyLog.findUnique({
      where: { id },
      include: {
        exercises: { orderBy: { id: "asc" } },
        meals: { orderBy: { id: "asc" } },
      },
    }),
    prisma.routine.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { exerciseCatalog: true }, orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.exerciseCatalog.findMany({ orderBy: { name: "asc" } }),
    prisma.dailyLog.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 10,
      select: {
        reactionTimeMs: true,
        stroopAccuracy: true,
        stroopAvgMs: true,
        balanceSec: true,
        digitSpan: true,
        fatigueScore: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  if (!log || log.userId !== session.user.id) notFound();

  function avg(vals: (number | null)[]) {
    const nums = vals.filter((v): v is number => v != null);
    return nums.length >= 5 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  }

  const personalAvgs = {
    reactionTimeMs: avg(recentLogs.map((l) => l.reactionTimeMs)),
    stroopAccuracy: avg(recentLogs.map((l) => l.stroopAccuracy)),
    stroopAvgMs: avg(recentLogs.map((l) => l.stroopAvgMs)),
    balanceSec: avg(recentLogs.map((l) => l.balanceSec)),
    digitSpan: avg(recentLogs.map((l) => l.digitSpan)),
    fatigueScore: avg(recentLogs.map((l) => l.fatigueScore)),
  };

  const routinesForClient = routines.map((r) => ({
    id: r.id,
    name: r.name,
    days: r.days.split(",").filter(Boolean).map(Number),
    items: r.items.map((item) => ({
      name: item.exerciseCatalog?.name ?? item.customName ?? "",
      category: (item.exerciseCatalog?.category as ExerciseCategory) ?? "CORE",
      durationMin: item.durationMin ?? item.exerciseCatalog?.defaultDurationMin ?? null,
      setsReps: item.setsReps ?? item.exerciseCatalog?.defaultSetsReps ?? null,
      benefit: item.exerciseCatalog?.benefit ?? null,
    })),
  }));

  const initialData = {
    id: log.id,
    date: log.date.toISOString().slice(0, 10),
    bedTime: log.bedTime ?? "",
    wakeTime: log.wakeTime ?? "",
    sleepHours: log.sleepHours != null ? String(log.sleepHours) : "",
    sleepQuality: log.sleepQuality != null ? String(log.sleepQuality) : "",
    energyMorning: log.energyMorning != null ? String(log.energyMorning) : "",
    energyAfternoon: log.energyAfternoon != null ? String(log.energyAfternoon) : "",
    energyEvening: log.energyEvening != null ? String(log.energyEvening) : "",
    studyFocusScore: log.studyFocusScore != null ? String(log.studyFocusScore) : "",
    studyFocusMinutes: log.studyFocusMinutes != null ? String(log.studyFocusMinutes) : "",
    reactionTimeMs: log.reactionTimeMs ?? null,
    stroopAccuracy: log.stroopAccuracy ?? null,
    stroopAvgMs: log.stroopAvgMs ?? null,
    balanceSec: log.balanceSec ?? null,
    digitSpan: log.digitSpan ?? null,
    painScore: log.painScore ?? null,
    fatigueScore: log.fatigueScore ?? null,
    overallRPE: log.overallRPE != null ? String(log.overallRPE) : "",
    exerciseNotes: log.exerciseNotes ?? "",
    exercises: log.exercises.map((ex) => ({
      name: ex.name,
      category: (ex.region as ExerciseCategory) ?? "CORE",
      durationMin: ex.durationMin ?? 0,
      setsReps: ex.setsReps ?? "",
      benefit: "",
      rpe: ex.rpe != null ? String(ex.rpe) : "",
      completed: ex.completed,
      pain: ex.pain,
      notes: ex.notes ?? "",
    })),
    meals: log.meals.map((m) => ({
      mealType: m.mealType,
      time: m.time ?? "",
      items: m.items,
      notes: m.notes ?? "",
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold">기록 수정</h1>
          <p className="text-sm text-slate-500">
            {log.date.toISOString().slice(0, 10)} ({log.dayOfWeek})
          </p>
        </div>
        <Link
          href={`/logs/${id}`}
          className="text-sm text-slate-500 underline hover:text-blue-600"
        >
          ← 상세로 돌아가기
        </Link>
      </div>
      <LogForm
        routines={routinesForClient}
        catalog={catalog.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category as ExerciseCategory,
          defaultDurationMin: c.defaultDurationMin,
          defaultSetsReps: c.defaultSetsReps,
        }))}
        personalAvgs={personalAvgs}
        userRole={
          (user?.role ?? null) as
            | "STUDENT"
            | "WORKER"
            | "ATHLETE"
            | "PATIENT"
            | "GENERAL"
            | null
        }
        initialData={initialData}
      />
    </div>
  );
}
