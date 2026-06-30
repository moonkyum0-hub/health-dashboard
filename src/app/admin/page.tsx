import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { claimAdmin, setAccountType } from "@/app/admin/actions";
import { ROLE_LABEL, type UserRole } from "@/lib/roleMetrics";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  USER: "일반 사용자",
  EXPERT: "전문가",
  ADMIN: "관리자",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  const existingAdmin = await prisma.user.findFirst({ where: { accountType: "ADMIN" } });

  if (me?.accountType !== "ADMIN") {
    if (existingAdmin) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-slate-500">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관리자 등록</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500">
              아직 관리자 계정이 없습니다. 본인을 관리자로 지정하시겠어요?
            </p>
            <form action={claimAdmin}>
              <Button type="submit" className="w-full rounded-full">
                내 계정을 관리자로 지정
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [users, dailyLogCount, questionCount, cardCount] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.dailyLog.count(),
    prisma.question.count(),
    prisma.knowledgeCard.count(),
  ]);

  const expertCount = users.filter((u) => u.accountType === "EXPERT").length;
  const adminCount = users.filter((u) => u.accountType === "ADMIN").length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-xl font-display font-semibold">관리자</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">서비스 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["전체 사용자", users.length],
              ["전문가", expertCount],
              ["관리자", adminCount],
              ["누적 일일 기록", dailyLogCount],
              ["질문 / 카드", `${questionCount} / ${cardCount}`],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">사용자 권한 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name || user.email}</p>
                  <p className="truncate text-xs text-slate-400">
                    {user.email} · 가입일 {user.createdAt.toISOString().slice(0, 10)}
                    {user.role && ` · ${ROLE_LABEL[user.role as UserRole] ?? user.role}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{ACCOUNT_TYPE_LABEL[user.accountType]}</Badge>
                  <form action={setAccountType.bind(null, user.id)} className="flex items-center gap-2">
                    <select
                      name="accountType"
                      defaultValue={user.accountType}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="USER">일반 사용자</option>
                      <option value="EXPERT">전문가</option>
                      <option value="ADMIN">관리자</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      변경
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
