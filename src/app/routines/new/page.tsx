import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/seedCatalog";
import RoutineBuilder from "@/components/RoutineBuilder";
import type { ExerciseCategory } from "@/lib/exerciseCatalog";

export default async function NewRoutinePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await ensureCatalogSeeded();
  const catalog = await prisma.exerciseCatalog.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-xl font-display font-semibold">새 루틴 만들기</h1>
      <p className="mb-6 text-sm text-slate-500">
        카탈로그에서 운동을 선택하거나 직접 입력해 나만의 루틴을 구성하세요.
      </p>
      <RoutineBuilder
        catalog={catalog.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category as ExerciseCategory,
          description: c.description,
          defaultDurationMin: c.defaultDurationMin,
          defaultSetsReps: c.defaultSetsReps,
        }))}
      />
    </div>
  );
}
