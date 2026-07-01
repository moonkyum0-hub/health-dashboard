import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RoleSettingsForm from "@/components/RoleSettingsForm";
import { resetOnboarding } from "@/app/onboarding/actions";
import type { UserRole } from "@/lib/roleMetrics";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  USER: "일반 사용자",
  EXPERT: "전문가",
  ADMIN: "관리자",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-xl font-display font-semibold">설정</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name || user.email}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
            <Badge variant={user.accountType === "USER" ? "secondary" : "default"}>
              {ACCOUNT_TYPE_LABEL[user.accountType] ?? user.accountType}
            </Badge>
          </div>
          {user.accountType !== "USER" && (
            <p className="mt-3 text-xs text-slate-400">
              {user.accountType === "EXPERT"
                ? "건강 정보 카드 작성과 커뮤니티 질문 답변이 가능합니다."
                : "전체 사용자 권한을 관리할 수 있습니다."}
            </p>
          )}
          {user.accountType === "ADMIN" && (
            <Button size="sm" variant="outline" className="mt-3 rounded-full" render={<Link href="/admin" />}>
              관리자 페이지로 이동
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">사용 목적</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500">
            선택한 목적에 맞춰 대시보드에서 보여드리는 핵심 지표가 달라져요.
          </p>
          <RoleSettingsForm initialRole={(user.role as UserRole) ?? "GENERAL"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">온보딩 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500">
            앱 사용법이 궁금하거나 처음 설정을 다시 하고 싶을 때 온보딩을 다시 볼 수 있어요.
          </p>
          <form action={resetOnboarding}>
            <Button type="submit" variant="outline" className="rounded-full">
              온보딩 다시 보기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
