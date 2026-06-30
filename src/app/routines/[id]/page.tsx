import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/seedCatalog";
import RoutineBuilder from "@/components/RoutineBuilder";
import type { ExerciseCategory } from "@/lib/exerciseCatalog";
import { deleteRoutine } from "@/app/routines/actions";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold">루틴 수정</h1>
          <p className="text-sm text-slate-500">{routine.name}</p>
        </div>
        <form action={deleteRoutine.bind(null, routine.id)}>
          <Button
            type="submit"
            variant="destructive"
            className="rounded-full"
          >
            루틴 삭제
          </Button>
        </form>
      </div>

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
    </div>
  );
}
