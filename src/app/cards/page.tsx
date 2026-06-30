import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CardsPage() {
  const session = await auth();
  const me = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  const canWrite = me?.accountType === "EXPERT" || me?.accountType === "ADMIN";

  const cards = await prisma.knowledgeCard.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true, images: { orderBy: { order: "asc" }, take: 1 } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold">건강 정보</h1>
          <p className="mt-1 text-sm text-slate-500">전문가가 작성한 건강 지식 카드를 확인하세요.</p>
        </div>
        {canWrite && (
          <Button className="rounded-full" render={<Link href="/cards/new" />}>
            + 카드 작성하기
          </Button>
        )}
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-slate-400">아직 작성된 카드가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`} className="block">
              <Card className="h-full overflow-hidden transition-colors hover:border-blue-300">
                {card.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.images[0].url}
                    alt={card.title}
                    className="h-32 w-full object-cover"
                  />
                )}
                <CardContent>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary">{card.category}</Badge>
                    <span className="shrink-0 text-xs text-slate-400">
                      {card.author.name || "전문가"}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 break-words">{card.summary}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
