import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTINE_TEMPLATES } from "@/lib/routineTemplates";
import { addRoutineFromTemplate } from "@/app/routines/actions";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function RoutinesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const routines = await prisma.routine.findMany({
    where: { userId: session.user.id },
    include: { items: true },
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
        <h2 className="mb-3 text-sm font-medium text-slate-500">추천 루틴</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ROUTINE_TEMPLATES.map((tpl) => (
            <li key={tpl.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{tpl.name}</p>
                <p className="truncate text-xs text-slate-400 mt-0.5">{tpl.description}</p>
              </div>
              <form action={addRoutineFromTemplate.bind(null, tpl.id)} className="shrink-0">
                <Button type="submit" size="sm" variant="outline" className="rounded-full">
                  + 추가
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      {routines.length === 0 ? (
        <p className="text-sm text-slate-400">아직 만든 루틴이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {routines.map((routine) => {
            const days = routine.days
              .split(",")
              .filter(Boolean)
              .map((d) => DAY_LABELS[Number(d)]);
            return (
              <li key={routine.id}>
                <Link href={`/routines/${routine.id}`} className="block">
                  <Card className="transition-colors hover:border-blue-300">
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate font-medium">{routine.name}</span>
                        <Badge variant="secondary">
                          {days.length > 0 ? days.join(", ") : "요일 미지정"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">운동 {routine.items.length}개</p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
