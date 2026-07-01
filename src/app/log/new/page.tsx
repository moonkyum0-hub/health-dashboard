import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/seedCatalog";
import LogForm from "@/components/LogForm";
import type { ExerciseCategory } from "@/lib/exerciseCatalog";

export default async function NewLogPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  await ensureCatalogSeeded();

  const [routines, catalog, recentLogs, user] = await Promise.all([
    prisma.routine.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { exerciseCatalog: true }, orderBy: { order: "asc" } } },
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold">새 일일 기록</h1>
          <p className="text-sm text-slate-500">
            오늘의 기상·운동·식단·에너지·집중도를 기록합니다.
          </p>
        </div>
        <Link href="/routines" className="text-sm text-slate-500 underline hover:text-blue-600">
          내 루틴 관리
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
        userRole={(user?.role ?? null) as "STUDENT" | "WORKER" | "ATHLETE" | "PATIENT" | "GENERAL" | null}
      />
    </div>
  );
}
