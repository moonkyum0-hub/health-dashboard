import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await prisma.knowledgeCard.findUnique({
    where: { id },
    include: { author: true, images: { orderBy: { order: "asc" } } },
  });

  if (!card) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary">{card.category}</Badge>
            <span className="text-xs text-slate-400">{card.author.name || "전문가"}</span>
          </div>
          <CardTitle className="text-xl">{card.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500 break-words">{card.summary}</p>

          {card.images.length > 0 && (
            <div className="mb-4 space-y-3">
              {card.images.map((img) => (
                <figure key={img.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption || card.title}
                    className="w-full rounded-xl object-cover"
                  />
                  {img.caption && (
                    <figcaption className="mt-1 text-center text-xs text-slate-400">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
            {card.body}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
