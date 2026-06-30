"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  exerciseCatalogId: z.string().optional(),
  customName: z.string().optional(),
  durationMin: z.coerce.number().min(0).max(180).optional(),
  setsReps: z.string().optional(),
});

const routineSchema = z.object({
  name: z.string().min(1).max(80),
  days: z.array(z.coerce.number().min(0).max(6)),
  items: z.array(itemSchema).min(1),
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function createRoutine(formData: FormData) {
  const userId = await requireUserId();
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("잘못된 요청입니다.");
  const parsed = routineSchema.parse(JSON.parse(raw));

  const routine = await prisma.routine.create({
    data: {
      userId,
      name: parsed.name,
      days: parsed.days.join(","),
      items: {
        create: parsed.items.map((item, idx) => ({
          exerciseCatalogId: item.exerciseCatalogId || null,
          customName: item.customName || null,
          durationMin: item.durationMin,
          setsReps: item.setsReps,
          order: idx,
        })),
      },
    },
  });

  redirect(`/routines/${routine.id}`);
}

export async function updateRoutine(routineId: string, formData: FormData) {
  const userId = await requireUserId();
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("잘못된 요청입니다.");
  const parsed = routineSchema.parse(JSON.parse(raw));

  const existing = await prisma.routine.findUnique({ where: { id: routineId } });
  if (!existing || existing.userId !== userId) {
    throw new Error("권한이 없습니다.");
  }

  await prisma.routine.update({
    where: { id: routineId },
    data: {
      name: parsed.name,
      days: parsed.days.join(","),
      items: {
        deleteMany: {},
        create: parsed.items.map((item, idx) => ({
          exerciseCatalogId: item.exerciseCatalogId || null,
          customName: item.customName || null,
          durationMin: item.durationMin,
          setsReps: item.setsReps,
          order: idx,
        })),
      },
    },
  });

  redirect(`/routines/${routineId}`);
}

export async function deleteRoutine(routineId: string) {
  const userId = await requireUserId();
  const existing = await prisma.routine.findUnique({ where: { id: routineId } });
  if (!existing || existing.userId !== userId) {
    throw new Error("권한이 없습니다.");
  }
  await prisma.routine.delete({ where: { id: routineId } });
  redirect("/routines");
}
