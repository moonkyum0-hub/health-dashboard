import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { exercises: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-display font-semibold">기록 목록</h1>
        <Button className="rounded-full" render={<Link href="/log/new" />}>
          + 새 기록
        </Button>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400">
          아직 기록이 없습니다. 첫 기록을 작성해보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => {
            const completed = log.exercises.filter((e) => e.completed).length;
            return (
              <li key={log.id}>
                <Link href={`/logs/${log.id}`} className="block">
                  <Card className="transition-colors hover:border-blue-300">
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {log.date.toISOString().slice(0, 10)} ({log.dayOfWeek})
                        </span>
                        <Badge variant="secondary">{log.routine}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>운동 완수 {completed}/{log.exercises.length}</span>
                        {log.overallRPE != null && <span>RPE {log.overallRPE}</span>}
                        {log.sleepHours != null && <span>수면 {log.sleepHours}h</span>}
                      </div>
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
