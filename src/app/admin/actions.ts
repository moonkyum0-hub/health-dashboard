"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const accountTypeSchema = z.enum(["USER", "EXPERT", "ADMIN"]);

export async function claimAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("로그인이 필요합니다.");

  const existingAdmin = await prisma.user.findFirst({ where: { accountType: "ADMIN" } });
  if (existingAdmin) throw new Error("이미 관리자가 존재합니다.");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { accountType: "ADMIN" },
  });

  revalidatePath("/admin");
}

export async function setAccountType(userId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("로그인이 필요합니다.");

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (me?.accountType !== "ADMIN") throw new Error("권한이 없습니다.");

  const parsed = accountTypeSchema.safeParse(formData.get("accountType"));
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: userId },
    data: { accountType: parsed.data },
  });

  revalidatePath("/admin");
}
