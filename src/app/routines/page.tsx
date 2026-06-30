import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

      <p className="mb-6 text-sm text-slate-500">
        정해진 루틴을 따르는 대신, 운동 카탈로그에서 직접 골라 나만의 루틴을 구성하세요.
        요일을 지정하면 해당 요일의 새 기록 작성 시 자동으로 불러옵니다.
      </p>

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
