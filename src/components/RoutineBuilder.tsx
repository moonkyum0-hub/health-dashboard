"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type ExerciseCategory,
} from "@/lib/exerciseCatalog";
import CategoryIcon from "@/components/icons/CategoryIcon";
import { createRoutine, updateRoutine } from "@/app/routines/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export interface CatalogItem {
  id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  defaultDurationMin: number | null;
  defaultSetsReps: string | null;
}

interface SelectedItem {
  key: string;
  exerciseCatalogId?: string;
  customName?: string;
  name: string;
  durationMin: string;
  setsReps: string;
}

interface InitialRoutine {
  id: string;
  name: string;
  days: number[];
  items: SelectedItem[];
}

export default function RoutineBuilder({
  catalog,
  initialRoutine,
}: {
  catalog: CatalogItem[];
  initialRoutine?: InitialRoutine;
}) {
  const [name, setName] = useState(initialRoutine?.name ?? "");
  const [days, setDays] = useState<Set<number>>(
    new Set(initialRoutine?.days ?? [])
  );
  const [items, setItems] = useState<SelectedItem[]>(initialRoutine?.items ?? []);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | "ALL">("ALL");
  const [customName, setCustomName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((ex) => {
      if (categoryFilter !== "ALL" && ex.category !== categoryFilter) return false;
      if (search && !ex.name.includes(search)) return false;
      return true;
    });
  }, [catalog, search, categoryFilter]);

  function toggleDay(day: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function addCatalogItem(ex: CatalogItem) {
    setItems((prev) => [
      ...prev,
      {
        key: `${ex.id}-${prev.length}`,
        exerciseCatalogId: ex.id,
        name: ex.name,
        durationMin: ex.defaultDurationMin ? String(ex.defaultDurationMin) : "",
        setsReps: ex.defaultSetsReps ?? "",
      },
    ]);
  }

  function addCustomItem() {
    if (!customName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        key: `custom-${prev.length}-${customName}`,
        customName: customName.trim(),
        name: customName.trim(),
        durationMin: "",
        setsReps: "",
      },
    ]);
    setCustomName("");
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function moveItem(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(formData: FormData) {
    if (!name.trim()) {
      setError("루틴 이름을 입력해주세요.");
      return;
    }
    if (items.length === 0) {
      setError("운동을 1개 이상 추가해주세요.");
      return;
    }

    const payload = {
      name: name.trim(),
      days: Array.from(days),
      items: items.map((i) => ({
        exerciseCatalogId: i.exerciseCatalogId,
        customName: i.customName,
        durationMin: i.durationMin || undefined,
        setsReps: i.setsReps || undefined,
      })),
    };

    formData.set("payload", JSON.stringify(payload));
    setSubmitting(true);
    setError(null);
    try {
      if (initialRoutine) {
        await updateRoutine(initialRoutine.id, formData);
      } else {
        await createRoutine(formData);
      }
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardContent>
          <Label className="flex flex-col items-stretch gap-1 text-sm font-normal">
            <span className="text-slate-500">루틴 이름</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 아침 활력 루틴"
            />
          </Label>

          <div className="mt-4">
            <span className="mb-2 block text-sm text-slate-500">반복 요일</span>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={days.has(idx) ? "default" : "outline"}
                  size="icon"
                  className="rounded-full"
                  onClick={() => toggleDay(idx)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">운동 카탈로그에서 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="운동 검색"
                className="flex-1 text-sm"
              />
              <Select
                value={categoryFilter}
                onValueChange={(value) =>
                  value && setCategoryFilter(value as ExerciseCategory | "ALL")
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

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {filteredCatalog.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addCatalogItem(ex)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-left text-sm hover:border-blue-300"
                >
                  <CategoryIcon category={ex.category} className="h-5 w-5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate font-medium">{ex.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {CATEGORY_LABEL[ex.category]}
                  </span>
                  <span className="shrink-0 text-slate-300">+</span>
                </button>
              ))}
              {filteredCatalog.length === 0 && (
                <p className="text-sm text-slate-400">검색 결과가 없습니다.</p>
              )}
            </div>

            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="목록에 없는 운동 직접 추가"
                className="flex-1 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomItem}>
                추가
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">내 루틴 ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">운동 카탈로그에서 운동을 선택해 추가하세요.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li
                    key={item.key}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      className="shrink-0 text-slate-300 hover:text-blue-600"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      className="shrink-0 text-slate-300 hover:text-blue-600"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="shrink-0 text-slate-300 hover:text-red-500"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-full">
        {submitting ? "저장 중..." : initialRoutine ? "루틴 수정하기" : "루틴 만들기"}
      </Button>
    </form>
  );
}
