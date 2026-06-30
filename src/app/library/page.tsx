import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensureCatalogSeeded } from "@/lib/seedCatalog";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/exerciseCatalog";
import { MUSCLE_HIGHLIGHT } from "@/lib/muscleHighlight";
import type { PoseKey } from "@/lib/poses";
import CategoryIcon from "@/components/icons/CategoryIcon";
import ExerciseDetailDialog from "@/components/ExerciseDetailDialog";
import { Button } from "@/components/ui/button";

export default async function LibraryPage() {
  const session = await auth();
  await ensureCatalogSeeded();
  const catalog = await prisma.exerciseCatalog.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-display font-semibold tracking-tight">운동 카탈로그</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 break-words">
            각 운동의 설명과 기대 효과를 확인하고, 마음에 드는 운동을 모아 나만의 루틴을 만들어보세요.
          </p>
        </div>
        <Button className="shrink-0 rounded-full" render={<Link href="/routines/new" />}>
          내 루틴 만들기
        </Button>
      </div>

      <div className="space-y-10">
        {CATEGORY_ORDER.map((category) => {
          const items = catalog.filter((ex) => ex.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-display font-semibold">
                <CategoryIcon category={category} className="h-5 w-5 text-slate-400" />
                {CATEGORY_LABEL[category]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((ex) => (
                  <ExerciseDetailDialog
                    key={ex.id}
                    id={ex.id}
                    category={category}
                    name={ex.name}
                    description={ex.description}
                    benefit={ex.benefit}
                    cue={ex.cue}
                    defaultDurationMin={ex.defaultDurationMin}
                    defaultSetsReps={ex.defaultSetsReps}
                    poseStart={(ex.poseStart as PoseKey) ?? "STANDING"}
                    poseEnd={(ex.poseEnd as PoseKey) ?? "STANDING"}
                    highlightSegments={MUSCLE_HIGHLIGHT[ex.name]}
                    videoUrl={ex.videoUrl}
                    canEdit={Boolean(session?.user)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
