import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/seedCatalog";
import RoutineBuilder from "@/components/RoutineBuilder";
import type { ExerciseCategory } from "@/lib/exerciseCatalog";
import { CATEGORY_LABEL } from "@/lib/exerciseCatalog";
import { deleteRoutine } from "@/app/routines/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  await ensureCatalogSeeded();

  const [routine, catalog] = await Promise.all([
    prisma.routine.findUnique({
      where: { id },
      include: { items: { include: { exerciseCatalog: true }, orderBy: { order: "asc" } } },
    }),
    prisma.exerciseCatalog.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!routine || routine.userId !== session.user.id) {
    notFound();
  }

  const initialRoutine = {
    id: routine.id,
    name: routine.name,
    days: routine.days.split(",").filter(Boolean).map(Number),
    items: routine.items.map((item) => ({
      key: item.id,
      exerciseCatalogId: item.exerciseCatalogId ?? undefined,
      customName: item.customName ?? undefined,
      name: item.exerciseCatalog?.name ?? item.customName ?? "",
      durationMin: item.durationMin != null ? String(item.durationMin) : "",
      setsReps: item.setsReps ?? "",
    })),
  };

  const days = routine.days.split(",").filter(Boolean).map((d) => DAY_LABELS[Number(d)]);
  const totalMin = routine.items.reduce((s, i) => s + (i.durationMin ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* 운동 목록 요약 */}
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-display font-semibold">{routine.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {days.length > 0 ? days.join(", ") + " · " : "요일 미지정 · "}
              총 {totalMin}분 · 운동 {routine.items.length}개
            </p>
          </div>
          <form action={deleteRoutine.bind(null, routine.id)}>
            <Button type="submit" variant="destructive" size="sm" className="rounded-full">
              삭제
            </Button>
          </form>
        </div>

        <Card>
          <CardContent className="p-0">
            {routine.items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">운동이 없습니다.</p>
            ) : (
              <ul>
                {routine.items.map((item, idx) => {
                  const name = item.exerciseCatalog?.name ?? item.customName ?? "";
                  const cat = item.exerciseCatalog?.category as ExerciseCategory | undefined;
                  return (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 text-sm ${
                        idx < routine.items.length - 1 ? "border-b border-slate-100" : ""
                      }`}
                    >
                      <span className="w-5 shrink-0 text-center text-xs text-slate-300 font-medium">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 font-medium truncate">{name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {[
                          item.durationMin ? `${item.durationMin}분` : null,
                          item.setsReps ?? null,
                        ].filter(Boolean).join(" · ")}
                      </span>
                      {cat && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {CATEGORY_LABEL[cat]}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 수정 폼 */}
      <details className="group">
        <summary className="mb-4 cursor-pointer list-none">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <span className="transition-transform group-open:rotate-90">▶</span>
            루틴 수정하기
          </span>
        </summary>

      <RoutineBuilder
          catalog={catalog.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category as ExerciseCategory,
            description: c.description,
            defaultDurationMin: c.defaultDurationMin,
            defaultSetsReps: c.defaultSetsReps,
          }))}
          initialRoutine={initialRoutine}
        />
      </details>
    </div>
  );
}
