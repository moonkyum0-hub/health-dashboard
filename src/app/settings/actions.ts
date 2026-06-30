"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roleSchema = z.enum(["STUDENT", "WORKER", "ATHLETE", "PATIENT", "GENERAL"]);

export async function updateUserRole(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = roleSchema.safeParse(formData.get("role"));
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: parsed.data },
  });

  redirect("/dashboard");
}
