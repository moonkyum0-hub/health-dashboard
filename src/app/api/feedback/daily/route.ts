import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailyFeedback } from "@/lib/claude";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { dailyLogId } = await request.json();
  if (typeof dailyLogId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const log = await prisma.dailyLog.findUnique({
    where: { id: dailyLogId },
    include: { exercises: true, meals: true },
  });

  if (!log || log.userId !== session.user.id) {
    return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const exerciseData = {
    date: log.date.toISOString().slice(0, 10),
    dayOfWeek: log.dayOfWeek,
    routine: log.routine,
    exercises: log.exercises.map((ex) => ({
      name: ex.name,
      region: ex.region,
      duration: ex.durationMin,
      setsReps: ex.setsReps,
      rpe: ex.rpe,
      completed: ex.completed,
      pain: ex.pain,
      notes: ex.notes,
    })),
    meals: log.meals.map((m) => ({
      mealType: m.mealType,
      time: m.time,
      items: m.items,
      notes: m.notes,
    })),
    totalDuration: log.totalExerciseMin,
    overallRPE: log.overallRPE,
    sleepHours: log.sleepHours,
    sleepQuality: log.sleepQuality,
    energyAfterExercise: log.energyMorning,
    studyFocusScore: log.studyFocusScore,
    studyFocusMinutes: log.studyFocusMinutes,
  };

  try {
    const content = await generateDailyFeedback(exerciseData);

    const feedback = await prisma.aiFeedback.create({
      data: {
        userId: session.user.id,
        dailyLogId: log.id,
        type: "DAILY",
        content,
      },
    });

    return NextResponse.json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 피드백 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
