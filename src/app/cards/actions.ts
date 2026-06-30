"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_CATEGORIES } from "@/lib/knowledgeCards";

const imageSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(200).optional(),
});

const cardSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(300),
  body: z.string().min(1).max(8000),
  category: z.enum(CARD_CATEGORIES),
  images: z.array(imageSchema).max(10),
});

export async function createKnowledgeCard(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.accountType !== "EXPERT" && user?.accountType !== "ADMIN") {
    throw new Error("전문가만 작성할 수 있습니다.");
  }

  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    throw new Error("잘못된 요청입니다.");
  }

  const parsed = cardSchema.parse(JSON.parse(raw));

  const card = await prisma.knowledgeCard.create({
    data: {
      title: parsed.title,
      summary: parsed.summary,
      body: parsed.body,
      category: parsed.category,
      authorId: session.user.id,
      images: {
        create: parsed.images.map((img, i) => ({
          url: img.url,
          caption: img.caption,
          order: i,
        })),
      },
    },
  });

  redirect(`/cards/${card.id}`);
}
