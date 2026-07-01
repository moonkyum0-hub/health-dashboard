"use client";

import { useState, useTransition } from "react";
import { ROLE_OPTIONS, type UserRole } from "@/lib/roleMetrics";
import { ROUTINE_TEMPLATES } from "@/lib/routineTemplates";
import { CATALOG_SEED, CATEGORY_LABEL, type ExerciseCategory } from "@/lib/exerciseCatalog";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const catalogByName = Object.fromEntries(CATALOG_SEED.map((e) => [e.name, e]));

const RECOMMENDED: Record<UserRole, string> = {
  STUDENT: "morning-wake-up",
  WORKER: "desk-stretch",
  ATHLETE: "lower-body",
  PATIENT: "pre-sleep",
  GENERAL: "morning-wake-up",
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [wakeTime, setWakeTime] = useState("");
  const [isPending, startTransition] = useTransition();

  function finish(opts: { skipTemplate?: boolean; skipWake?: boolean } = {}) {
    startTransition(async () => {
      await completeOnboarding({
        role: role ?? undefined,
        templateId: opts.skipTemplate ? undefined : (templateId ?? undefined),
        wakeTime: opts.skipWake ? undefined : (wakeTime || undefined),
      });
    });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      {/* 진행 표시 */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-10 rounded-full transition-colors ${
              s <= step ? "bg-blue-600" : "bg-slate-200"
            }`}
          />
        ))}
        <span className="ml-3 text-xs text-slate-400">{step}/3</span>
      </div>

      {/* ── Step 1: 사용 목적 ── */}
      {step === 1 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-600">시작하기</p>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            어떤 목적으로 사용하시나요?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            목적에 맞춰 대시보드 핵심 지표와 루틴 추천이 달라져요.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  role === opt.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className={`font-medium text-sm ${role === opt.value ? "text-blue-700" : ""}`}>
                  {opt.label}
                </p>
                <p className="mt-1 text-xs text-slate-500">{opt.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={() => {
                if (role) setTemplateId(RECOMMENDED[role]);
                setStep(2);
              }}
              disabled={!role}
              className="flex-1 rounded-full"
              size="lg"
            >
              다음 →
            </Button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: 루틴 선택 ── */}
      {step === 2 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-600">루틴 설정</p>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            시작할 루틴을 골라보세요
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            '운동 보기'로 어떤 운동이 있는지 먼저 확인해보세요. 나중에 수정할 수 있어요.
          </p>

          <ul className="mt-6 space-y-2">
            {ROUTINE_TEMPLATES.map((tpl) => (
              <li key={tpl.id}>
                <div
                  className={`rounded-xl border transition-colors ${
                    templateId === tpl.id ? "border-blue-600 bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setTemplateId(tpl.id === templateId ? null : tpl.id)}
                      className="flex-1 text-left"
                    >
                      <p className={`font-medium text-sm ${templateId === tpl.id ? "text-blue-700" : ""}`}>
                        {tpl.name}
                      </p>
                      <p className="text-xs text-slate-400">{tpl.description}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewId(previewId === tpl.id ? null : tpl.id)}
                      className="shrink-0 text-xs text-blue-500 hover:underline"
                    >
                      {previewId === tpl.id ? "접기" : "운동 보기"}
                    </button>
                  </div>

                  {previewId === tpl.id && (
                    <ul className="border-t border-slate-100 px-4 pb-3 pt-2 space-y-1.5">
                      {tpl.exerciseNames.map((name) => {
                        const ex = catalogByName[name];
                        return (
                          <li key={name} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-700">{name}</span>
                            {ex && (
                              <Badge variant="secondary" className="shrink-0">
                                {CATEGORY_LABEL[ex.category as ExerciseCategory]}
                              </Badge>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-full" size="lg">
              ←
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="flex-1 rounded-full"
              size="lg"
            >
              다음 →
            </Button>
            <button
              type="button"
              onClick={() => { setTemplateId(null); setStep(3); }}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: 기상 시간 ── */}
      {step === 3 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-600">마지막 단계</p>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            보통 몇 시에 일어나세요?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            기록할 때 자동으로 채워드리고, AI가 수면 패턴 분석에 활용해요.
          </p>

          <div className="mt-6">
            <Input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="text-lg h-12"
            />
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="rounded-full" size="lg">
              ←
            </Button>
            <Button
              onClick={() => finish()}
              disabled={isPending}
              className="flex-1 rounded-full"
              size="lg"
            >
              {isPending ? "설정 중..." : "첫 기록 작성하러 가기 →"}
            </Button>
            <button
              type="button"
              onClick={() => finish({ skipWake: true })}
              disabled={isPending}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
