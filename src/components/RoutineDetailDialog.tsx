"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL, type ExerciseCategory } from "@/lib/exerciseCatalog";

interface RoutineItemDetail {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  benefit: string | null;
  durationMin: number | null;
  setsReps: string | null;
}

interface RoutineData {
  id: string;
  name: string;
  days: string[];
  totalMin: number;
  items: RoutineItemDetail[];
}

export default function RoutineListWithDialog({
  routines,
}: {
  routines: RoutineData[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const selected = routines.find((r) => r.id === open) ?? null;

  return (
    <>
      <ul className="space-y-3">
        {routines.map((routine) => (
          <li key={routine.id}>
            <button
              type="button"
              onClick={() => setOpen(routine.id)}
              className="w-full text-left"
            >
              <div className="rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-blue-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate font-medium">{routine.name}</span>
                  <Badge variant="secondary">
                    {routine.days.length > 0 ? routine.days.join(", ") : "요일 미지정"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  운동 {routine.items.length}개 · 총 {routine.totalMin}분
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-slate-400">
                  {selected.days.length > 0 ? selected.days.join(", ") + " · " : ""}
                  총 {selected.totalMin}분 · {selected.items.length}개 운동
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100"
                aria-label="닫기"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="space-y-3">
              {selected.items.map((item, idx) => (
                <li key={item.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">
                      <span className="mr-2 text-xs text-slate-300">{idx + 1}</span>
                      {item.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABEL[item.category as ExerciseCategory] ?? item.category}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        {[
                          item.durationMin ? `${item.durationMin}분` : null,
                          item.setsReps ?? null,
                        ].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </div>
                  {item.benefit && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{item.benefit}</p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 rounded-full"
                render={<Link href={`/routines/${selected.id}`} />}
                onClick={() => setOpen(null)}
              >
                수정하기
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-full"
                render={<Link href="/log/new" />}
                onClick={() => setOpen(null)}
              >
                오늘 기록 작성
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
