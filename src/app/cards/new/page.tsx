import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KnowledgeCardForm from "@/components/KnowledgeCardForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewCardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (me?.accountType !== "EXPERT" && me?.accountType !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-slate-500">전문가 계정만 카드를 작성할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-xl font-display font-semibold">건강 정보 카드 작성</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 카드</CardTitle>
        </CardHeader>
        <CardContent>
          <KnowledgeCardForm />
        </CardContent>
      </Card>
    </div>
  );
}
