"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type ExerciseCategory,
} from "@/lib/exerciseCatalog";
import CategoryIcon from "@/components/icons/CategoryIcon";
import ReactionTimeTest from "@/components/ReactionTimeTest";
import StroopTest, { type StroopResult } from "@/components/StroopTest";
import BalanceTest from "@/components/BalanceTest";
import { createDailyLog } from "@/app/log/new/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoutineItem {
  name: string;
  category: ExerciseCategory;
  durationMin: number | null;
  setsReps: string | null;
  benefit: string | null;
}

interface RoutineOption {
  id: string;
  name: string;
  days: number[];
  items: RoutineItem[];
}

interface CatalogOption {
  id: string;
  name: string;
  category: ExerciseCategory;
  defaultDurationMin: number | null;
  defaultSetsReps: string | null;
}

interface ExerciseRow {
  name: string;
  category: ExerciseCategory;
  durationMin: number;
  setsReps: string;
  benefit: string;
  rpe: string;
  completed: boolean;
  pain: boolean;
  notes: string;
}

interface MealRow {
  mealType: string;
  time: string;
  items: string;
  notes: string;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function computeSleepHours(bedTime: string, wakeTime: string): string {
  if (!bedTime || !wakeTime) return "";
  const [bedH, bedM] = bedTime.split(":").map(Number);
  const [wakeH, wakeM] = wakeTime.split(":").map(Number);
  if ([bedH, bedM, wakeH, wakeM].some((n) => Number.isNaN(n))) return "";

  const bedMinutes = bedH * 60 + bedM;
  let wakeMinutes = wakeH * 60 + wakeM;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;

  const hours = (wakeMinutes - bedMinutes) / 60;
  return String(Math.round(hours * 10) / 10);
}

function buildRowsFromRoutine(routine: RoutineOption | null): ExerciseRow[] {
  if (!routine) return [];
  return routine.items.map((item) => ({
    name: item.name,
    category: item.category,
    durationMin: item.durationMin ?? 0,
    setsReps: item.setsReps ?? "",
    benefit: item.benefit ?? "",
    rpe: "",
    completed: true,
    pain: false,
    notes: "",
  }));
}

const EMPTY_MEAL: MealRow = { mealType: "아침식사", time: "", items: "", notes: "" };

export default function LogForm({
  routines,
  catalog,
  personalAvgs,
}: {
  routines: RoutineOption[];
  catalog: CatalogOption[];
  personalAvgs?: {
    reactionTimeMs: number | null;
    stroopAccuracy: number | null;
    stroopAvgMs: number | null;
    balanceSec: number | null;
  };
}) {
  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState(toDateInputValue(today));

  const dayOfWeek = new Date(date).getDay();
  const matchingRoutine = routines.find((r) => r.days.includes(dayOfWeek)) ?? null;

  const [selectedRoutineId, setSelectedRoutineId] = useState<string | "NONE">(
    matchingRoutine?.id ?? "NONE"
  );
  const selectedRoutine =
    routines.find((r) => r.id === selectedRoutineId) ?? null;

  const [exercises, setExercises] = useState<ExerciseRow[]>(() =>
    buildRowsFromRoutine(matchingRoutine)
  );
  const [meals, setMeals] = useState<MealRow[]>([{ ...EMPTY_MEAL }]);

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<ExerciseCategory | "ALL">("ALL");

  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("04:30");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepHoursTouched, setSleepHoursTouched] = useState(false);
  const [sleepQuality, setSleepQuality] = useState("");
  const [energyMorning, setEnergyMorning] = useState("");
  const [energyAfternoon, setEnergyAfternoon] = useState("");
  const [energyEvening, setEnergyEvening] = useState("");
  const [studyFocusScore, setStudyFocusScore] = useState("");
  const [studyFocusMinutes, setStudyFocusMinutes] = useState("");
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null);
  const [stroopResult, setStroopResult] = useState<StroopResult | null>(null);
  const [balanceSec, setBalanceSec] = useState<number | null>(null);
  const [overallRPE, setOverallRPE] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleDateChange(value: string) {
    setDate(value);
    const nextDay = new Date(value).getDay();
    const next = routines.find((r) => r.days.includes(nextDay)) ?? null;
    setSelectedRoutineId(next?.id ?? "NONE");
    setExercises(buildRowsFromRoutine(next));
  }

  function handleBedTimeChange(value: string) {
    setBedTime(value);
    if (!sleepHoursTouched) setSleepHours(computeSleepHours(value, wakeTime));
  }

  function handleWakeTimeChange(value: string) {
    setWakeTime(value);
    if (!sleepHoursTouched) setSleepHours(computeSleepHours(bedTime, value));
  }

  function handleSleepHoursChange(value: string) {
    setSleepHours(value);
    setSleepHoursTouched(value.trim().length > 0);
  }

  function handleRoutineChange(routineId: string) {
    setSelectedRoutineId(routineId as string | "NONE");
    const routine = routines.find((r) => r.id === routineId) ?? null;
    setExercises(buildRowsFromRoutine(routine));
  }

  function updateExercise(idx: number, patch: Partial<ExerciseRow>) {
    setExercises((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  }

  function addFromCatalog(item: CatalogOption) {
    setExercises((rows) => [
      ...rows,
      {
        name: item.name,
        category: item.category,
        durationMin: item.defaultDurationMin ?? 0,
        setsReps: item.defaultSetsReps ?? "",
        benefit: "",
        rpe: "",
        completed: true,
        pain: false,
        notes: "",
      },
    ]);
  }

  function addCustomExercise() {
    setExercises((rows) => [
      ...rows,
      {
        name: "",
        category: "CORE",
        durationMin: 0,
        setsReps: "",
        benefit: "",
        rpe: "",
        completed: true,
        pain: false,
        notes: "",
      },
    ]);
  }

  function removeExercise(idx: number) {
    setExercises((rows) => rows.filter((_, i) => i !== idx));
  }

  function updateMeal(idx: number, patch: Partial<MealRow>) {
    setMeals((rows) => rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function addMeal() {
    setMeals((rows) => [...rows, { ...EMPTY_MEAL, mealType: "" }]);
  }

  function removeMeal(idx: number) {
    setMeals((rows) => rows.filter((_, i) => i !== idx));
  }

  const filteredCatalog = catalog.filter((ex) => {
    if (catalogFilter !== "ALL" && ex.category !== catalogFilter) return false;
    if (catalogSearch && !ex.name.includes(catalogSearch)) return false;
    return true;
  });

  const totalExerciseMin = exercises.reduce(
    (sum, ex) => sum + (ex.completed ? Number(ex.durationMin) || 0 : 0),
    0
  );

  async function handleSubmit(formData: FormData) {
    const routineLabel = selectedRoutine
      ? selectedRoutine.name
      : exercises.length > 0
        ? "자유 기록"
        : "REST";

    const payload = {
      date,
      routine: routineLabel,
      bedTime,
      wakeTime,
      sleepHours: sleepHours || undefined,
      sleepQuality: sleepQuality || undefined,
      energyMorning: energyMorning || undefined,
      energyAfternoon: energyAfternoon || undefined,
      energyEvening: energyEvening || undefined,
      studyFocusScore: studyFocusScore || undefined,
      studyFocusMinutes: studyFocusMinutes || undefined,
      reactionTimeMs: reactionTimeMs ?? undefined,
      stroopAccuracy: stroopResult?.accuracy ?? undefined,
      stroopAvgMs: stroopResult?.avgMs ?? undefined,
      balanceSec: balanceSec ?? undefined,
      overallRPE: overallRPE || undefined,
      totalExerciseMin,
      exerciseNotes,
      exercises: exercises
        .filter((ex) => ex.name.trim().length > 0)
        .map((ex) => ({
          name: ex.name,
          region: ex.category,
          durationMin: ex.durationMin || undefined,
          setsReps: ex.setsReps,
          rpe: ex.rpe || undefined,
          completed: ex.completed,
          pain: ex.pain,
          notes: ex.notes || undefined,
        })),
      meals: meals
        .filter((m) => m.mealType.trim().length > 0 && m.items.trim().length > 0)
        .map((m) => ({
          mealType: m.mealType,
          time: m.time || undefined,
          items: m.items,
          notes: m.notes || undefined,
        })),
    };

    formData.set("payload", JSON.stringify(payload));
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createDailyLog(formData);
    } catch {
      setSubmitError("저장에 실패했습니다. 입력값을 확인하고 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="날짜">
              <Input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </Field>
            <Field label="취침 시간">
              <Input
                type="time"
                value={bedTime}
                onChange={(e) => handleBedTimeChange(e.target.value)}
              />
            </Field>
            <Field label="기상 시간">
              <Input
                type="time"
                value={wakeTime}
                onChange={(e) => handleWakeTimeChange(e.target.value)}
              />
            </Field>
            <Field label="수면 시간(h, 자동계산)">
              <Input
                type="number"
                step="0.1"
                value={sleepHours}
                onChange={(e) => handleSleepHoursChange(e.target.value)}
                placeholder="취침/기상 시간 입력 시 자동 계산"
              />
            </Field>
            <Field
              label="수면 질 (1-10)"
              hint="얼마나 푹 잤는지에 대한 주관적인 느낌이에요. 1=거의 못 잤다, 5=그저 그랬다, 10=정말 개운하게 잤다 기준으로 적어주세요."
            >
              <Input
                type="number"
                min={1}
                max={10}
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>운동</CardTitle>
            {routines.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="shrink-0">불러올 루틴</span>
                <Select
                  value={selectedRoutineId}
                  onValueChange={(value) => handleRoutineChange(value ?? "NONE")}
                >
                  <SelectTrigger size="sm">
                    <span className="flex flex-1 text-left text-sm">
                      {selectedRoutineId === "NONE"
                        ? "직접 구성"
                        : routines.find((r) => r.id === selectedRoutineId)?.name ?? "루틴 선택"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">직접 구성</SelectItem>
                    {routines.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {routines.length === 0 && (
            <p className="mb-3 text-sm text-slate-400">
              아직 만든 루틴이 없습니다. 아래에서 운동을 직접 추가하거나,{" "}
              <Link href="/routines/new" className="underline">
                루틴 만들기
              </Link>
              로 이동해 미리 구성해두면 다음부터 자동으로 불러옵니다.
            </p>
          )}

          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-3">
                <div className="grid gap-3 md:grid-cols-7">
                  <Input
                    placeholder="운동명"
                    value={ex.name}
                    onChange={(e) => updateExercise(idx, { name: e.target.value })}
                    className="md:col-span-2"
                  />
                  <Select
                    value={ex.category}
                    onValueChange={(value) =>
                      value && updateExercise(idx, { category: value as ExerciseCategory })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ORDER.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABEL[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="분"
                    value={ex.durationMin || ""}
                    onChange={(e) =>
                      updateExercise(idx, { durationMin: Number(e.target.value) })
                    }
                  />
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      placeholder="RPE"
                      min={0}
                      max={10}
                      value={ex.rpe}
                      onChange={(e) => updateExercise(idx, { rpe: e.target.value })}
                    />
                    <HintBadge text="RPE = 운동 자각도. 이 운동이 얼마나 힘들었는지를 1~10으로 표현해요. 1=숨도 안 찼다, 5=약간 힘들다, 10=더 이상 못할 정도로 힘들다." />
                  </div>
                  <Label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                    <Checkbox
                      checked={ex.completed}
                      onCheckedChange={(checked) =>
                        updateExercise(idx, { completed: checked === true })
                      }
                    />
                    완수
                  </Label>
                  <Label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                    <Checkbox
                      checked={ex.pain}
                      onCheckedChange={(checked) =>
                        updateExercise(idx, { pain: checked === true })
                      }
                    />
                    통증
                  </Label>
                </div>

                {ex.benefit && (
                  <p className="mt-2 text-xs text-slate-400 break-words">{ex.benefit}</p>
                )}

                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="관찰/특이사항 메모"
                    value={ex.notes}
                    onChange={(e) => updateExercise(idx, { notes: e.target.value })}
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeExercise(idx)}
                    className="shrink-0 text-slate-500"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-medium text-slate-600">카탈로그에서 운동 찾기</p>
            <div className="mb-2 flex flex-wrap gap-2">
              <Input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="운동 검색"
                className="flex-1 text-sm"
              />
              <Select
                value={catalogFilter}
                onValueChange={(value) =>
                  value && setCatalogFilter(value as ExerciseCategory | "ALL")
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  {CATEGORY_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {filteredCatalog.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addFromCatalog(ex)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white"
                >
                  <CategoryIcon category={ex.category} className="h-4 w-4 shrink-0 text-slate-300" />
                  <span className="min-w-0 flex-1 truncate">{ex.name}</span>
                  <span className="shrink-0 text-slate-300">+</span>
                </button>
              ))}
              {filteredCatalog.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-slate-400">검색 결과가 없습니다.</p>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addCustomExercise}
            className="mt-3 border-dashed text-slate-600"
          >
            + 직접 입력해서 추가
          </Button>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="총 운동 시간(분, 자동계산)">
              <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-sm">
                {totalExerciseMin}
              </div>
            </Field>
            <Field
              label="전체 RPE (1-10)"
              hint="RPE = 운동 자각도. 오늘 운동 전체가 체감상 얼마나 힘들었는지를 1~10으로 표현해요. 1=숨도 안 찼다, 5=약간 힘들다, 10=더 이상 못할 정도로 힘들다."
            >
              <Input
                type="number"
                min={0}
                max={10}
                value={overallRPE}
                onChange={(e) => setOverallRPE(e.target.value)}
              />
            </Field>
          </div>
          <Field label="운동 종합 메모" className="mt-3">
            <Textarea
              value={exerciseNotes}
              onChange={(e) => setExerciseNotes(e.target.value)}
              rows={2}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>식단</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {meals.map((meal, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-5">
                <Input
                  placeholder="구분(아침식사 등)"
                  value={meal.mealType}
                  onChange={(e) => updateMeal(idx, { mealType: e.target.value })}
                />
                <Input
                  type="time"
                  value={meal.time}
                  onChange={(e) => updateMeal(idx, { time: e.target.value })}
                />
                <Input
                  placeholder="섭취 항목 (예: 바나나, 요거트)"
                  value={meal.items}
                  onChange={(e) => updateMeal(idx, { items: e.target.value })}
                  className="sm:col-span-2"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="메모"
                    value={meal.notes}
                    onChange={(e) => updateMeal(idx, { notes: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMeal(idx)}
                    className="shrink-0 text-slate-500"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addMeal}
            className="mt-3 border-dashed text-slate-600"
          >
            + 식사 추가
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>에너지 &amp; 학습 집중도</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Field
              label="오전 에너지(1-10)"
              hint="아침 시간대 몸 상태/활력을 1~10으로 표현해요. 1=매우 처진다, 10=매우 활기차다."
            >
              <Input
                type="number"
                min={0}
                max={10}
                value={energyMorning}
                onChange={(e) => setEnergyMorning(e.target.value)}
              />
            </Field>
            <Field
              label="오후 에너지(1-10)"
              hint="점심 이후 시간대 몸 상태/활력을 1~10으로 표현해요. 1=매우 처진다, 10=매우 활기차다."
            >
              <Input
                type="number"
                min={0}
                max={10}
                value={energyAfternoon}
                onChange={(e) => setEnergyAfternoon(e.target.value)}
              />
            </Field>
            <Field
              label="저녁 에너지(1-10)"
              hint="저녁 시간대 몸 상태/활력을 1~10으로 표현해요. 1=매우 처진다, 10=매우 활기차다."
            >
              <Input
                type="number"
                min={0}
                max={10}
                value={energyEvening}
                onChange={(e) => setEnergyEvening(e.target.value)}
              />
            </Field>
            <Field
              label="오전 집중도(1-10)"
              hint="공부할 때 얼마나 집중이 잘 됐는지를 1~10으로 표현해요. 1=전혀 집중 안 됨, 10=완전히 몰입함."
            >
              <Input
                type="number"
                min={0}
                max={10}
                value={studyFocusScore}
                onChange={(e) => setStudyFocusScore(e.target.value)}
              />
            </Field>
            <Field label="집중 지속(분)">
              <Input
                type="number"
                value={studyFocusMinutes}
                onChange={(e) => setStudyFocusMinutes(e.target.value)}
              />
            </Field>
          </div>

          <EnergyAnalysis
            morning={energyMorning}
            afternoon={energyAfternoon}
            evening={energyEvening}
            focus={studyFocusScore}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block text-sm font-normal text-slate-500">
                반응속도 테스트 (각성도)
              </Label>
              <ReactionTimeTest value={reactionTimeMs} onChange={setReactionTimeMs} personalAvg={personalAvgs?.reactionTimeMs} />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-normal text-slate-500">
                스트룹 테스트 (주의력·실행기능)
              </Label>
              <StroopTest value={stroopResult} onChange={setStroopResult} personalAvgAccuracy={personalAvgs?.stroopAccuracy} personalAvgMs={personalAvgs?.stroopAvgMs} />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-normal text-slate-500">
                한 발 서기 (균형 능력)
              </Label>
              <BalanceTest value={balanceSec} onChange={setBalanceSec} personalAvg={personalAvgs?.balanceSec} />
            </div>
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-full">
        {submitting ? "저장 중..." : "기록 저장하기"}
      </Button>
    </form>
  );
}

type EnergyLevel = "high" | "mid" | "low";

function toLevel(v: string): EnergyLevel | null {
  const n = Number(v);
  if (!v || isNaN(n) || n <= 0) return null;
  if (n >= 7) return "high";
  if (n >= 4) return "mid";
  return "low";
}

function EnergyAnalysis({
  morning, afternoon, evening, focus,
}: {
  morning: string; afternoon: string; evening: string; focus: string;
}) {
  const vals = [morning, afternoon, evening].map(Number).filter((_, i) =>
    [morning, afternoon, evening][i] !== ""
  );
  const hasEnergy = vals.length > 0;
  const hasFocus = focus !== "";
  if (!hasEnergy && !hasFocus) return null;

  const avgEnergy = hasEnergy ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const mornN = morning !== "" ? Number(morning) : null;
  const evenN = evening !== "" ? Number(evening) : null;
  const energyDrop = mornN !== null && evenN !== null && mornN - evenN >= 3;

  const eLevel = avgEnergy !== null ? toLevel(String(Math.round(avgEnergy))) : null;
  const fLevel = hasFocus ? toLevel(focus) : null;

  let badge = "";
  let badgeColor = "";
  let message = "";

  if (eLevel === "high" && fLevel === "high") {
    badge = "최상 컨디션"; badgeColor = "bg-green-100 text-green-800";
    message = "에너지와 집중도 모두 높은 이상적인 상태예요. 오늘 학습 효율이 높을 가능성이 커요. 이 컨디션을 만든 수면·운동 패턴을 기록해두면 나중에 좋은 참고가 돼요.";
  } else if (eLevel === "high" && fLevel === "mid") {
    badge = "에너지 양호"; badgeColor = "bg-blue-100 text-blue-800";
    message = "몸 상태는 좋은데 집중도가 보통이에요. 학습 환경 소음, 스마트폰 등 외부 방해 요소를 점검해보세요. 짧은 집중-휴식 사이클(25분 집중 + 5분 휴식)을 활용하면 도움이 돼요.";
  } else if (eLevel === "high" && fLevel === "low") {
    badge = "집중 저하 주의"; badgeColor = "bg-yellow-100 text-yellow-800";
    message = "에너지는 충분한데 집중이 잘 안 되는 상태예요. 과도한 정보량이나 수면 리듬 불균형이 원인일 수 있어요. 5~10분 가벼운 스트레칭 후 다시 시도해보세요.";
  } else if (eLevel === "mid" && fLevel === "high") {
    badge = "집중력 양호"; badgeColor = "bg-blue-100 text-blue-800";
    message = "에너지는 보통이지만 집중력이 좋은 상태예요. 적당한 긴장감이 오히려 집중에 도움이 되고 있어요. 에너지 보충을 위해 수분 섭취와 짧은 휴식을 챙기세요.";
  } else if (eLevel === "mid" && fLevel === "mid") {
    badge = "보통 컨디션"; badgeColor = "bg-slate-100 text-slate-700";
    message = "에너지와 집중도가 모두 보통 수준이에요. 가벼운 유산소 운동(10~15분 걷기)이 에너지와 집중도를 동시에 올려주는 효과가 있어요. 수면 시간도 점검해보세요.";
  } else if (eLevel === "mid" && fLevel === "low") {
    badge = "컨디션 저하"; badgeColor = "bg-orange-100 text-orange-800";
    message = "전반적으로 컨디션이 다소 저하된 상태예요. 누적 피로이거나 수면 부족일 수 있어요. 억지로 집중하기보다 짧은 회복 시간을 갖고 다시 시작하는 게 효율적이에요.";
  } else if (eLevel === "low" && fLevel === "high") {
    badge = "의지력으로 집중 중"; badgeColor = "bg-yellow-100 text-yellow-800";
    message = "몸은 피곤하지만 집중력으로 버티고 있는 상태예요. 수분 섭취와 스트레칭을 꼭 챙기고, 너무 무리하지 않도록 주의하세요. 오늘 취침을 평소보다 30분 일찍 하는 게 좋아요.";
  } else if (eLevel === "low" && fLevel === "mid") {
    badge = "피로 상태"; badgeColor = "bg-orange-100 text-orange-800";
    message = "에너지가 낮고 집중도도 떨어지고 있어요. 수면 부족이나 영양 섭취 불균형이 원인일 수 있어요. 오늘 운동 강도를 낮추고 충분한 수분과 영양 섭취에 집중하세요.";
  } else if (eLevel === "low" && fLevel === "low") {
    badge = "충분한 회복 필요"; badgeColor = "bg-red-100 text-red-800";
    message = "에너지와 집중도가 모두 많이 낮은 상태예요. 억지로 공부나 강한 운동을 강행하면 효과가 없고 회복을 더 늦출 수 있어요. 오늘은 가벼운 스트레칭과 충분한 수면을 우선시하세요.";
  } else if (!hasFocus && eLevel === "high") {
    badge = "에너지 양호"; badgeColor = "bg-green-100 text-green-800";
    message = "오늘 에너지 상태가 좋은 편이에요. 집중도도 함께 기록하면 더 정확한 분석이 가능해요.";
  } else if (!hasFocus && eLevel === "mid") {
    badge = "보통 컨디션"; badgeColor = "bg-slate-100 text-slate-700";
    message = "에너지가 보통 수준이에요. 집중도 점수도 함께 기록해보세요.";
  } else if (!hasFocus && eLevel === "low") {
    badge = "에너지 저하"; badgeColor = "bg-orange-100 text-orange-800";
    message = "오늘 에너지가 낮은 편이에요. 수분 섭취, 가벼운 스트레칭, 수면 시간을 확인해보세요.";
  } else if (!hasEnergy && fLevel === "high") {
    badge = "집중 양호"; badgeColor = "bg-green-100 text-green-800";
    message = "집중도가 높은 상태예요. 에너지 수준도 함께 기록하면 더 의미 있는 분석이 가능해요.";
  } else if (!hasEnergy && fLevel === "mid") {
    badge = "집중 보통"; badgeColor = "bg-slate-100 text-slate-700";
    message = "집중도가 보통 수준이에요. 에너지 점수도 함께 기록해보세요.";
  } else if (!hasEnergy && fLevel === "low") {
    badge = "집중 저하"; badgeColor = "bg-orange-100 text-orange-800";
    message = "집중이 잘 안 되는 상태예요. 짧은 휴식이나 자리 이동이 도움이 될 수 있어요.";
  }

  const dropNote = energyDrop
    ? " 오전보다 저녁 에너지가 크게 떨어졌어요. 오후 짧은 낮잠(10~20분)이나 스트레칭이 에너지 회복에 효과적이에요."
    : "";

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
          {badge}
        </span>
        <span className="text-xs text-slate-400">오늘의 상태 분석</span>
      </div>
      <p className="leading-relaxed text-slate-700">
        {message}{dropNote}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Label className={`flex flex-col items-stretch gap-1 text-sm font-normal ${className ?? ""}`}>
      <span className="flex items-center gap-1 text-slate-500">
        {label}
        {hint && <HintBadge text={hint} />}
      </span>
      {children}
    </Label>
  );
}

function HintBadge({ text }: { text: string }) {
  return (
    <span className="group/hint relative inline-flex">
      <button
        type="button"
        tabIndex={0}
        className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-slate-300 text-[9px] leading-none text-slate-400"
        aria-label="설명 보기"
      >
        ?
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs leading-snug font-normal whitespace-normal text-white opacity-0 shadow-lg transition-opacity group-hover/hint:opacity-100 group-focus-within/hint:opacity-100">
        {text}
      </span>
    </span>
  );
}
