import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRegionProgress } from "@/lib/claude";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/exerciseCatalog";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const exercises = await prisma.exerciseLog.findMany({
    where: { dailyLog: { userId: session.user.id } },
  });

  if (exercises.length === 0) {
    return NextResponse.json(
      { error: "분석할 운동 기록이 없습니다." },
      { status: 400 }
    );
  }

  const regionData = CATEGORY_ORDER.map((region) => {
    const rows = exercises.filter((e) => e.region === region);
    const completed = rows.filter((r) => r.completed).length;
    const painCount = rows.filter((r) => r.pain).length;
    const rpeValues = rows.map((r) => r.rpe).filter((v): v is number => v != null);
    return {
      region,
      label: CATEGORY_LABEL[region],
      totalLogged: rows.length,
      completedCount: completed,
      completionRate: rows.length ? Math.round((completed / rows.length) * 100) : 0,
      painOccurrences: painCount,
      averageRPE: rpeValues.length
        ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
        : null,
    };
  });

  try {
    const content = await generateRegionProgress(regionData);
    const feedback = await prisma.aiFeedback.create({
      data: {
        userId: session.user.id,
        type: "REGION",
        content,
      },
    });
    return NextResponse.json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 피드백 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
