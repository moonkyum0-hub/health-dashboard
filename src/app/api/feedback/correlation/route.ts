import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCorrelationAnalysis } from "@/lib/claude";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });

  const withFocus = logs.filter((l) => l.studyFocusScore != null);
  if (withFocus.length < 4) {
    return NextResponse.json(
      { error: "상관관계 분석을 위해서는 최소 4일 이상의 집중도 기록이 필요합니다." },
      { status: 400 }
    );
  }

  const exerciseDayLogs = withFocus.filter((l) => l.routine !== "REST" && l.totalExerciseMin);
  const nonExerciseDayLogs = withFocus.filter((l) => !exerciseDayLogs.includes(l));

  const avg = (nums: number[]) =>
    nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;

  const correlationData = {
    analysisStart: withFocus[0].date.toISOString().slice(0, 10),
    analysisEnd: withFocus[withFocus.length - 1].date.toISOString().slice(0, 10),
    dataPoints: withFocus.length,
    exerciseDayCount: exerciseDayLogs.length,
    nonExerciseDayCount: nonExerciseDayLogs.length,
    exerciseDayAvgFocus: avg(
      exerciseDayLogs.map((l) => l.studyFocusScore).filter((v): v is number => v != null)
    ),
    nonExerciseDayAvgFocus: avg(
      nonExerciseDayLogs.map((l) => l.studyFocusScore).filter((v): v is number => v != null)
    ),
    exerciseDayAvgFocusMinutes: avg(
      exerciseDayLogs.map((l) => l.studyFocusMinutes).filter((v): v is number => v != null)
    ),
    nonExerciseDayAvgFocusMinutes: avg(
      nonExerciseDayLogs.map((l) => l.studyFocusMinutes).filter((v): v is number => v != null)
    ),
  };

  try {
    const content = await generateCorrelationAnalysis(correlationData);
    const feedback = await prisma.aiFeedback.create({
      data: {
        userId: session.user.id,
        type: "CORRELATION",
        content,
      },
    });
    return NextResponse.json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 피드백 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
