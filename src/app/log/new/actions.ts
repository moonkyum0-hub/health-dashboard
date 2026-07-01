"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAY_LABEL_KO = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

const exerciseSchema = z.object({
  name: z.string().min(1),
  region: z.enum(["CORE", "UPPER", "LOWER", "FLEXIBILITY", "CARDIO"]),
  durationMin: z.coerce.number().min(0).max(180).optional(),
  setsReps: z.string().optional(),
  rpe: z.coerce.number().min(0).max(10).optional(),
  completed: z.boolean().default(true),
  pain: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

const mealSchema = z.object({
  mealType: z.string().min(1),
  time: z.string().optional(),
  items: z.string().min(1),
  notes: z.string().max(2000).optional(),
});

const payloadSchema = z.object({
  date: z.string(),
  routine: z.string().min(1).max(80),
  bedTime: z.string().optional(),
  wakeTime: z.string().optional(),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  sleepQuality: z.coerce.number().min(0).max(10).optional(),
  energyMorning: z.coerce.number().min(0).max(10).optional(),
  energyAfternoon: z.coerce.number().min(0).max(10).optional(),
  energyEvening: z.coerce.number().min(0).max(10).optional(),
  studyFocusScore: z.coerce.number().min(0).max(10).optional(),
  studyFocusMinutes: z.coerce.number().min(0).max(1000).optional(),
  reactionTimeMs: z.coerce.number().min(0).max(5000).optional(),
  stroopAccuracy: z.coerce.number().min(0).max(100).optional(),
  stroopAvgMs: z.coerce.number().min(0).max(10000).optional(),
  balanceSec: z.coerce.number().min(0).max(600).optional(),
  digitSpan: z.coerce.number().min(0).max(9).optional(),
  painScore: z.coerce.number().min(0).max(10).optional(),
  fatigueScore: z.coerce.number().min(0).max(10).optional(),
  phq2Score: z.coerce.number().min(0).max(6).optional(),
  chairStand: z.coerce.number().min(0).max(60).optional(),
  overallRPE: z.coerce.number().min(0).max(10).optional(),
  totalExerciseMin: z.coerce.number().min(0).max(300).optional(),
  exerciseNotes: z.string().max(4000).optional(),
  exercises: z.array(exerciseSchema),
  meals: z.array(mealSchema),
});

export async function createDailyLog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    throw new Error("잘못된 요청입니다.");
  }

  const parsed = payloadSchema.parse(JSON.parse(raw));
  const date = new Date(parsed.date);
  const dayOfWeek = DAY_LABEL_KO[date.getDay()];

  const dailyLog = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: {
      userId: session.user.id,
      date,
      dayOfWeek,
      routine: parsed.routine,
      bedTime: parsed.bedTime,
      wakeTime: parsed.wakeTime,
      sleepHours: parsed.sleepHours,
      sleepQuality: parsed.sleepQuality,
      energyMorning: parsed.energyMorning,
      energyAfternoon: parsed.energyAfternoon,
      energyEvening: parsed.energyEvening,
      studyFocusScore: parsed.studyFocusScore,
      studyFocusMinutes: parsed.studyFocusMinutes,
      reactionTimeMs: parsed.reactionTimeMs,
      stroopAccuracy: parsed.stroopAccuracy,
      stroopAvgMs: parsed.stroopAvgMs,
      balanceSec: parsed.balanceSec,
      digitSpan: parsed.digitSpan,
      painScore: parsed.painScore,
      fatigueScore: parsed.fatigueScore,
      phq2Score: parsed.phq2Score,
      chairStand: parsed.chairStand,
      overallRPE: parsed.overallRPE,
      totalExerciseMin: parsed.totalExerciseMin,
      exerciseNotes: parsed.exerciseNotes,
      exercises: { create: parsed.exercises },
      meals: { create: parsed.meals },
    },
    update: {
      dayOfWeek,
      routine: parsed.routine,
      bedTime: parsed.bedTime,
      wakeTime: parsed.wakeTime,
      sleepHours: parsed.sleepHours,
      sleepQuality: parsed.sleepQuality,
      energyMorning: parsed.energyMorning,
      energyAfternoon: parsed.energyAfternoon,
      energyEvening: parsed.energyEvening,
      studyFocusScore: parsed.studyFocusScore,
      studyFocusMinutes: parsed.studyFocusMinutes,
      reactionTimeMs: parsed.reactionTimeMs,
      stroopAccuracy: parsed.stroopAccuracy,
      stroopAvgMs: parsed.stroopAvgMs,
      balanceSec: parsed.balanceSec,
      digitSpan: parsed.digitSpan,
      painScore: parsed.painScore,
      fatigueScore: parsed.fatigueScore,
      phq2Score: parsed.phq2Score,
      chairStand: parsed.chairStand,
      overallRPE: parsed.overallRPE,
      totalExerciseMin: parsed.totalExerciseMin,
      exerciseNotes: parsed.exerciseNotes,
      exercises: { deleteMany: {}, create: parsed.exercises },
      meals: { deleteMany: {}, create: parsed.meals },
    },
  });

  redirect(`/logs/${dailyLog.id}`);
}
