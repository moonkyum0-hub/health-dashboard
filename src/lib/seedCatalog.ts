import { prisma } from "@/lib/prisma";
import { CATALOG_SEED } from "@/lib/exerciseCatalog";

let seeded = false;

export async function ensureCatalogSeeded() {
  if (seeded) return;

  for (const ex of CATALOG_SEED) {
    await prisma.exerciseCatalog.upsert({
      where: { name: ex.name },
      create: {
        name: ex.name,
        category: ex.category,
        description: ex.description,
        benefit: ex.benefit,
        cue: ex.cue,
        defaultDurationMin: ex.defaultDurationMin,
        defaultSetsReps: ex.defaultSetsReps,
        poseStart: ex.poseStart,
        poseEnd: ex.poseEnd,
        videoUrl: ex.videoUrl,
      },
      update: {
        category: ex.category,
        description: ex.description,
        benefit: ex.benefit,
        cue: ex.cue,
        defaultDurationMin: ex.defaultDurationMin,
        defaultSetsReps: ex.defaultSetsReps,
        poseStart: ex.poseStart,
        poseEnd: ex.poseEnd,
        videoUrl: ex.videoUrl,
      },
    });
  }

  try {
    await prisma.exerciseCatalog.deleteMany({
      where: {
        createdById: null,
        name: { notIn: CATALOG_SEED.map((ex) => ex.name) },
      },
    });
  } catch {
    // referenced by an existing routine item; leave the stale row in place
  }

  seeded = true;
}
