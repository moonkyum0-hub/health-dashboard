import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyAnalysis } from "@/lib/claude";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const weekEndDate = body.weekEndDate ? new Date(body.weekEndDate) : new Date();
  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekStartDate.getDate() - 6);

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: weekStartDate, lte: weekEndDate },
    },
    orderBy: { date: "asc" },
  });

  if (logs.length === 0) {
    return NextResponse.json(
      { error: "최근 7일간 기록이 없어 주간 분석을 생성할 수 없습니다." },
      { status: 400 }
    );
  }

  const exerciseDayLogs = logs.filter((l) => l.routine !== "REST" && l.totalExerciseMin);
  const nonExerciseDayLogs = logs.filter((l) => !exerciseDayLogs.includes(l));

  const avg = (nums: number[]) =>
    nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

  const weeklyData = {
    weekStartDate: weekStartDate.toISOString().slice(0, 10),
    weekEndDate: weekEndDate.toISOString().slice(0, 10),
    dailyRecords: logs.map((l) => ({
      date: l.date.toISOString().slice(0, 10),
      routine: l.routine,
      sleepHours: l.sleepHours,
      sleepQuality: l.sleepQuality,
      overallRPE: l.overallRPE,
      studyFocusScore: l.studyFocusScore,
      studyFocusMinutes: l.studyFocusMinutes,
      energyMorning: l.energyMorning,
      energyAfternoon: l.energyAfternoon,
      energyEvening: l.energyEvening,
    })),
    weeklyStats: {
      totalExerciseDays: exerciseDayLogs.length,
      totalExerciseTime: exerciseDayLogs.reduce((s, l) => s + (l.totalExerciseMin ?? 0), 0),
      averageSleep: avg(logs.map((l) => l.sleepHours).filter((v): v is number => v != null)),
      exerciseDayAvgFocus: avg(
        exerciseDayLogs.map((l) => l.studyFocusScore).filter((v): v is number => v != null)
      ),
      nonExerciseDayAvgFocus: avg(
        nonExerciseDayLogs.map((l) => l.studyFocusScore).filter((v): v is number => v != null)
      ),
      averageRPE: avg(logs.map((l) => l.overallRPE).filter((v): v is number => v != null)),
    },
  };

  try {
    const content = await generateWeeklyAnalysis(weeklyData);
    const feedback = await prisma.aiFeedback.create({
      data: {
        userId: session.user.id,
        type: "WEEKLY",
        periodStart: weekStartDate,
        periodEnd: weekEndDate,
        content,
      },
    });
    return NextResponse.json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 피드백 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
