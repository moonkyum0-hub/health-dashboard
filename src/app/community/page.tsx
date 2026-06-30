import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true, answers: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold">커뮤니티 Q&amp;A</h1>
          <p className="mt-1 text-sm text-slate-500">궁금한 점을 질문하고 전문가의 답변을 받아보세요.</p>
        </div>
        <Button className="rounded-full" render={<Link href="/community/new" />}>
          + 질문하기
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-slate-400">아직 등록된 질문이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/community/${q.id}`} className="block">
                <Card className="transition-colors hover:border-blue-300">
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate font-medium">{q.title}</span>
                      <Badge variant={q.answers.length > 0 ? "default" : "secondary"}>
                        답변 {q.answers.length}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {q.author.name || "익명"} · {q.createdAt.toISOString().slice(0, 10)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
