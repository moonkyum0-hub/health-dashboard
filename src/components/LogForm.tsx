"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type ExerciseCategory,
} from "@/lib/exerciseCatalog";
import CategoryIcon from "@/components/icons/CategoryIcon";
import ReactionTimeTest from "@/components/ReactionTimeTest";
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
}: {
  routines: RoutineOption[];
  catalog: CatalogOption[];
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
            <Field label="수면 질 (1-10)">
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
                    <SelectValue />
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
              <a href="/routines/new" className="underline">
                루틴 만들기
              </a>
              로 이동해 미리 구성해두면 다음부터 자동으로 불러옵니다.
            </p>
          )}

          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-3">
                <div className="grid gap-3 sm:grid-cols-6">
                  <Input
                    placeholder="운동명"
                    value={ex.name}
                    onChange={(e) => updateExercise(idx, { name: e.target.value })}
                    className="sm:col-span-2"
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
                  <Input
                    type="number"
                    placeholder="RPE"
                    min={0}
                    max={10}
                    value={ex.rpe}
                    onChange={(e) => updateExercise(idx, { rpe: e.target.value })}
                  />
                  <div className="flex items-center gap-3 text-sm">
                    <Label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={ex.completed}
                        onCheckedChange={(checked) =>
                          updateExercise(idx, { completed: checked === true })
                        }
                      />
                      완수
                    </Label>
                    <Label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={ex.pain}
                        onCheckedChange={(checked) =>
                          updateExercise(idx, { pain: checked === true })
                        }
                      />
                      통증
                    </Label>
                  </div>
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
            <Field label="전체 RPE (1-10)">
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
            <Field label="오전 에너지(1-10)">
              <Input
                type="number"
                min={0}
                max={10}
                value={energyMorning}
                onChange={(e) => setEnergyMorning(e.target.value)}
              />
            </Field>
            <Field label="오후 에너지(1-10)">
              <Input
                type="number"
                min={0}
                max={10}
                value={energyAfternoon}
                onChange={(e) => setEnergyAfternoon(e.target.value)}
              />
            </Field>
            <Field label="저녁 에너지(1-10)">
              <Input
                type="number"
                min={0}
                max={10}
                value={energyEvening}
                onChange={(e) => setEnergyEvening(e.target.value)}
              />
            </Field>
            <Field label="오전 집중도(1-10)">
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

          <div className="mt-4">
            <Label className="mb-1 block text-sm font-normal text-slate-500">
              반응속도 테스트 (객관적 집중도·각성도 측정)
            </Label>
            <ReactionTimeTest value={reactionTimeMs} onChange={setReactionTimeMs} />
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

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Label className={`flex flex-col items-stretch gap-1 text-sm font-normal ${className ?? ""}`}>
      <span className="text-slate-500">{label}</span>
      {children}
    </Label>
  );
}
