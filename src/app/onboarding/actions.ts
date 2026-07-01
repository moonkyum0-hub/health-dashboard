"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROUTINE_TEMPLATES } from "@/lib/routineTemplates";
import type { UserRole } from "@/lib/roleMetrics";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function completeOnboarding({
  role,
  templateId,
  wakeTime,
}: {
  role?: UserRole;
  templateId?: string;
  wakeTime?: string;
}) {
  const userId = await requireUserId();

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingDone: true,
      ...(role ? { role } : {}),
      ...(wakeTime ? { defaultWakeTime: wakeTime } : {}),
    },
  });

  if (templateId) {
    const template = ROUTINE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      const catalogEntries = await prisma.exerciseCatalog.findMany({
        where: { name: { in: template.exerciseNames } },
      });
      const byName = new Map(catalogEntries.map((c) => [c.name, c]));
      await prisma.routine.create({
        data: {
          userId,
          name: template.name,
          days: template.days.join(","),
          items: {
            create: template.exerciseNames
              .map((name) => byName.get(name))
              .filter((c): c is NonNullable<typeof c> => Boolean(c))
              .map((c, idx) => ({
                exerciseCatalogId: c.id,
                durationMin: c.defaultDurationMin,
                setsReps: c.defaultSetsReps,
                order: idx,
              })),
          },
        },
      });
    }
  }

  redirect("/log/new");
}

export async function resetOnboarding() {
  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingDone: false },
  });
  redirect("/onboarding");
}
