import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import RoutineListWithDialog from "@/components/RoutineDetailDialog";
import RoutineTemplateCards from "@/components/RoutineTemplateCards";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function RoutinesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const routines = await prisma.routine.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { exerciseCatalog: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-display font-semibold">내 루틴</h1>
        <Button className="rounded-full" render={<Link href="/routines/new" />}>
          + 새 루틴 만들기
        </Button>
      </div>

      <p className="mb-6 text-sm text-slate-400">
        요일을 지정하면 기록 작성 시 자동으로 불러옵니다.
      </p>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-slate-500">추천 루틴 <span className="font-normal text-slate-400">(클릭하면 운동 목록을 볼 수 있어요)</span></h2>
        <RoutineTemplateCards />
      </div>

      {routines.length === 0 ? (
        <p className="text-sm text-slate-400">아직 만든 루틴이 없습니다.</p>
      ) : (
        <RoutineListWithDialog
          routines={routines.map((r) => ({
            id: r.id,
            name: r.name,
            days: r.days.split(",").filter(Boolean).map((d) => DAY_LABELS[Number(d)]),
            totalMin: r.items.reduce((s, i) => s + (i.durationMin ?? 0), 0),
            items: r.items.map((i) => ({
              id: i.id,
              name: i.exerciseCatalog?.name ?? i.customName ?? "",
              category: i.exerciseCatalog?.category ?? null,
              description: i.exerciseCatalog?.description ?? null,
              benefit: i.exerciseCatalog?.benefit ?? null,
              durationMin: i.durationMin ?? null,
              setsReps: i.setsReps ?? null,
            })),
          }))}
        />
      )}
    </div>
  );
}
