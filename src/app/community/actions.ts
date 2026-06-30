"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const questionSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(4000),
});

export async function createQuestion(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = questionSchema.parse({
    title: formData.get("title"),
    body: formData.get("body"),
  });

  const question = await prisma.question.create({
    data: { ...parsed, authorId: session.user.id },
  });

  redirect(`/community/${question.id}`);
}

const answerSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function createAnswer(questionId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.accountType !== "EXPERT" && user?.accountType !== "ADMIN") {
    throw new Error("전문가만 답변할 수 있습니다.");
  }

  const parsed = answerSchema.parse({ body: formData.get("body") });

  await prisma.answer.create({
    data: { body: parsed.body, questionId, expertId: session.user.id },
  });

  revalidatePath(`/community/${questionId}`);
}
