import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoMark from "@/components/Logo";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/log/new", label: "새 기록" },
  { href: "/logs", label: "기록 목록" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/routines", label: "내 루틴" },
  { href: "/library", label: "운동 카탈로그" },
  { href: "/community", label: "커뮤니티" },
  { href: "/cards", label: "건강 정보" },
  { href: "/settings", label: "설정" },
];

export default async function NavBar() {
  const session = await auth();
  const me = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <LogoMark size={26} />
          <span className="truncate font-display font-bold tracking-tight text-slate-900">
            My Health Dashboard
          </span>
        </Link>

        {session?.user ? (
          <nav className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-blue-600">
                {link.label}
              </Link>
            ))}
            {me?.accountType === "ADMIN" && (
              <Link href="/admin" className="whitespace-nowrap text-blue-600 hover:text-blue-700">
                관리자
              </Link>
            )}
            <span className="max-w-[12rem] truncate text-slate-400">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="rounded-full">
                로그아웃
              </Button>
            </form>
          </nav>
        ) : (
          <nav className="flex shrink-0 items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              로그인
            </Button>
            <Button size="sm" className="rounded-full" render={<Link href="/register" />}>
              시작하기
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
