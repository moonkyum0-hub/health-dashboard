import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAnswer } from "@/app/community/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [question, me] = await Promise.all([
    prisma.question.findUnique({
      where: { id },
      include: {
        author: true,
        answers: { include: { expert: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (!question) notFound();

  const canAnswer = me?.accountType === "EXPERT" || me?.accountType === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">{question.title}</CardTitle>
          <p className="text-sm text-slate-500">
            {question.author.name || "익명"} · {question.createdAt.toISOString().slice(0, 10)}
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
            {question.body}
          </p>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-display font-semibold">답변 {question.answers.length}</h2>
      <div className="space-y-3">
        {question.answers.map((a) => (
          <Card key={a.id}>
            <CardContent>
              <div className="mb-1 flex items-center gap-2">
                <Badge>전문가</Badge>
                <span className="text-xs text-slate-400">
                  {a.expert.name || "전문가"} · {a.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{a.body}</p>
            </CardContent>
          </Card>
        ))}
        {question.answers.length === 0 && (
          <p className="text-sm text-slate-400">아직 답변이 없습니다.</p>
        )}
      </div>

      {canAnswer && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">답변 작성 (전문가)</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAnswer.bind(null, question.id)} className="space-y-3">
              <Textarea name="body" required rows={5} maxLength={4000} placeholder="답변을 입력하세요" />
              <Button type="submit" className="rounded-full">
                답변 등록
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
