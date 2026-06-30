import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="hero-glow absolute inset-0 -z-10" />
        <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <p className="mb-4 text-xs font-medium tracking-widest text-slate-500 uppercase">
            Personal Health Infrastructure
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-display font-semibold tracking-tight sm:text-6xl">
            My Health Dashboard
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            나의 건강과 생활을 한눈에.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {session?.user ? (
              <>
                <Button size="lg" className="rounded-full" render={<Link href="/log/new" />}>
                  오늘 기록 작성하기
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                  render={<Link href="/dashboard" />}
                >
                  대시보드 보기
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="rounded-full" render={<Link href="/register" />}>
                  무료로 시작하기
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                  render={<Link href="/login" />}
                >
                  로그인
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <FeatureSection
        eyebrow="01 — RECORD"
        title="기록"
        description="기상, 운동, 식단, 수면, 학습 집중도까지 매일의 컨디션을 빠짐없이 남깁니다."
      >
        <MockRecordCard />
      </FeatureSection>

      <FeatureSection
        eyebrow="02 — CHOOSE"
        title="선택"
        description="운동 카탈로그에서 설명과 효과를 확인하고, 나만의 루틴을 직접 구성하세요. 정해진 루틴을 따르기보다, 내가 고르고 조정합니다."
        reverse
      >
        <MockCatalogCard />
      </FeatureSection>

      <FeatureSection
        eyebrow="03 — IMPROVE"
        title="개선"
        description="쌓인 기록을 분석해 부족한 부분을 짚어주고, 그에 맞는 운동과 생활·식습관 개선안을 추천합니다."
      >
        <MockInsightCard />
      </FeatureSection>

      <section className="border-t border-slate-200 px-6 py-20 text-center">
        <h2 className="text-2xl font-display font-semibold tracking-tight sm:text-3xl">
          지금 바로 첫 기록을 시작하세요
        </h2>
        <div className="mt-6">
          <Button
            size="lg"
            className="rounded-full"
            render={<Link href={session?.user ? "/log/new" : "/register"} />}
          >
            {session?.user ? "오늘 기록 작성하기" : "무료로 시작하기"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureSection({
  eyebrow,
  title,
  description,
  children,
  reverse,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="border-t border-slate-200 px-6 py-16 sm:py-20">
      <div
        className={`mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2 ${
          reverse ? "sm:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium tracking-widest text-slate-400">{eyebrow}</p>
          <h2 className="text-4xl font-display font-semibold tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 break-words">
            {description}
          </p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function MockRecordCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-medium text-slate-400">오늘의 기록</p>
      <div className="space-y-2">
        {[
          ["기상 시간", "04:30"],
          ["수면", "6.5h · 질 7/10"],
          ["오전 에너지", "7/10"],
          ["집중 지속", "150분"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockCatalogCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-medium text-slate-400">운동 카탈로그</p>
      <div className="space-y-2">
        {[
          ["플랭크", "코어"],
          ["맨몸 스쿼트", "하체"],
          ["Y-W-T 교정 운동", "상지"],
        ].map(([name, cat]) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
          >
            <span className="truncate font-medium">{name}</span>
            <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
              {cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockInsightCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-medium text-slate-400">맞춤 추천</p>
      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <p className="font-medium">수면 부족 경향이 보여요</p>
        <p className="mt-1 text-slate-600">
          최근 평균 수면 5.8시간 — 저녁 스트레칭과 취침 루틴을 추천드려요.
        </p>
      </div>
    </div>
  );
}
